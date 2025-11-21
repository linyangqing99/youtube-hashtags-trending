// 修复hashtag统计字段的脚本
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://isorrcmivuomzolnaxgi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlzb3JyY21pdnVvbXpvbG5heGdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MDg2NDgsImV4cCI6MjA3OTI4NDY0OH0.5wBVfHSIIxJQiq3NjlI0FY3w2x1WIjyLY8cuFBQhJsA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixHashtagStats() {
  console.log('🔧 开始修复hashtag统计字段...');

  try {
    // 1. 获取所有视频和观看数
    const { data: videos, error: videoError } = await supabase
      .from('videos')
      .select('id, view_count');

    if (videoError) throw videoError;

    console.log(`📹 找到 ${videos.length} 个视频`);

    // 2. 获取所有hashtag关联
    const { data: relations, error: relationError } = await supabase
      .from('video_hashtags')
      .select('hashtag_id, video_id');

    if (relationError) throw relationError;

    console.log(`🔗 找到 ${relations.length} 个关联关系`);

    // 3. 计算每个hashtag的统计信息
    const hashtagStats = {};

    // 初始化hashtag统计
    const uniqueHashtagIds = [...new Set(relations.map(r => r.hashtag_id))];
    uniqueHashtagIds.forEach(hashtagId => {
      hashtagStats[hashtagId] = {
        total_mentions: 0,
        total_videos: 0,
        total_views: 0,
        video_ids: new Set()
      };
    });

    // 统计每个hashtag
    relations.forEach(relation => {
      const stats = hashtagStats[relation.hashtag_id];
      if (stats) {
        stats.total_mentions++;
        stats.video_ids.add(relation.video_id);
      }
    });

    // 计算总观看数
    const videoViewMap = {};
    videos.forEach(video => {
      videoViewMap[video.id] = video.view_count || 0;
    });

    Object.keys(hashtagStats).forEach(hashtagId => {
      const stats = hashtagStats[hashtagId];
      stats.video_ids.forEach(videoId => {
        stats.total_views += videoViewMap[videoId] || 0;
      });
      stats.total_videos = stats.video_ids.size;
    });

    // 4. 更新数据库中的hashtag统计 (只更新count字段)
    let updatedCount = 0;

    for (const [hashtagId, stats] of Object.entries(hashtagStats)) {
      const { error: updateError } = await supabase
        .from('hashtags')
        .update({
          count: stats.total_mentions
        })
        .eq('id', hashtagId);

      if (updateError) {
        console.error(`❌ 更新hashtag ${hashtagId} 失败:`, updateError.message);
      } else {
        updatedCount++;
      }
    }

    console.log(`✅ 成功更新 ${updatedCount} 个hashtag的统计信息`);

    // 5. 显示修复后的top 10 hashtags
    const { data: topHashtags } = await supabase
      .from('hashtags')
      .select('name, count')
      .order('count', { ascending: false })
      .limit(10);

    console.log('\n🔥 修复后的Top 10 Hashtags:');
    topHashtags.forEach((hashtag, index) => {
      const stats = hashtagStats[hashtag.id];
      console.log(`  ${index + 1}. #${hashtag.name} - ${hashtag.count} 次 (${stats?.total_videos || 0} 个视频)`);
    });

    return updatedCount;

  } catch (error) {
    console.error('💥 修复失败:', error.message);
    throw error;
  }
}

async function verifyFix() {
  console.log('\n🔍 验证修复结果...');

  const { data: verification } = await supabase
    .from('hashtags')
    .select('name, count, total_videos, total_views')
    .order('count', { ascending: false })
    .limit(5);

  verification.forEach((hashtag, index) => {
    console.log(`  ${index + 1}. ${hashtag.name}: count=${hashtag.count}, videos=${hashtag.total_videos}, views=${hashtag.total_views}`);
  });
}

// 主函数
async function main() {
  try {
    await fixHashtagStats();
    await verifyFix();
    console.log('\n🎉 Hashtag统计字段修复完成!');
  } catch (error) {
    console.error('\n💥 修复失败:', error.message);
    process.exit(1);
  }
}

// 运行脚本
main();