// 创建时间序列数据的脚本
try {
  require('dotenv').config({ path: '.env.local' });
} catch (err) {
  console.warn('⚠️ dotenv 未安装，跳过自动加载 .env.local（已预期，如果你用 shell 导出变量可忽略）');
}
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('缺少 Supabase 环境变量，请设置 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTimeSeriesData() {
  console.log('⏰ 开始创建时间序列数据...');

  try {
    // 获取当前时间戳
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // 只取日期部分
    const currentHour = new Date(now);
    currentHour.setMinutes(0, 0, 0);

    console.log(`📅 创建日期: ${today} | 当前小时: ${currentHour.toISOString()}`);

    // 1. 创建视频快照数据
    console.log('\n📹 创建视频快照...');

    const { data: videos } = await supabase
      .from('videos')
      .select('id, view_count, like_count, comment_count');

    if (videos && videos.length > 0) {
      console.log(`找到 ${videos.length} 个视频，开始创建快照...`);

      let snapshotCount = 0;

      for (const video of videos) {
        const { error: snapshotError } = await supabase
          .from('video_snapshots')
          .upsert({
            video_id: video.id,
            view_count: video.view_count || 0,
            like_count: video.like_count || 0,
            comment_count: video.comment_count || 0,
            snapshot_date: now.toISOString()
          }, {
            onConflict: 'video_id,snapshot_date'
          });

        if (snapshotError) {
          console.error(`❌ 视频快照创建失败 (${video.id}):`, snapshotError.message);
        } else {
          snapshotCount++;
        }
      }

      console.log(`✅ 成功创建 ${snapshotCount} 个视频快照`);
    }

    // 2. 创建hashtag趋势数据
    console.log('\n🏷️ 创建hashtag趋势数据...');

    const { data: hashtags } = await supabase
      .from('hashtags')
      .select('id, name, count');

    if (hashtags && hashtags.length > 0) {
      console.log(`找到 ${hashtags.length} 个hashtags，开始计算趋势...`);

      // 拉取关联关系，一次性聚合以减少往返
      const { data: relations } = await supabase
        .from('video_hashtags')
        .select('hashtag_id, video_id');

      const videoIds = Array.from(new Set(relations?.map((r) => r.video_id) || []));

      const { data: relatedVideos } = await supabase
        .from('videos')
        .select('id, view_count')
        .in('id', videoIds);

      const videoViewMap = new Map();
      relatedVideos?.forEach((v) => videoViewMap.set(v.id, v.view_count || 0));

      // 计算每个hashtag的统计信息
      const hashtagStats = [];

      for (const hashtag of hashtags) {
        const hashtagRelations = (relations || []).filter((r) => r.hashtag_id === hashtag.id);
        const uniqueVideosSet = new Set(hashtagRelations.map((r) => r.video_id));
        const uniqueVideoCount = uniqueVideosSet.size;
        const totalViews = Array.from(uniqueVideosSet).reduce(
          (sum, vid) => sum + (videoViewMap.get(vid) || 0),
          0
        );

        const mentionCount = hashtagRelations.length || 0;

        // 创建小时级趋势数据
        const { error: trendError } = await supabase
          .from('hashtag_trends_hourly')
          .upsert({
            hashtag_id: hashtag.id,
            mention_count: mentionCount,
            unique_videos: uniqueVideoCount,
            total_views: totalViews,
            trend_at: currentHour.toISOString(),
            region_code: 'US',
          }, {
            onConflict: 'hashtag_id,trend_at,region_code'
          });

        if (trendError) {
          console.error(`❌ Hashtag趋势创建失败 (${hashtag.name}):`, trendError.message);
        } else {
          hashtagStats.push({
            name: hashtag.name,
            mentions: mentionCount,
            videos: uniqueVideoCount,
            views: totalViews
          });
        }
      }

      // 显示top 10 hashtags
      hashtagStats.sort((a, b) => b.mentions - a.mentions);
      console.log('🔥 Top 10 Hashtag趋势(小时级):');
      hashtagStats.slice(0, 10).forEach((stat, index) => {
        console.log(`  ${index + 1}. #${stat.name} - ${stat.mentions}次提及, ${stat.videos}个视频, ${stat.views.toLocaleString()}总观看数`);
      });

      console.log(`✅ 成功创建 ${hashtagStats.length} 个hashtag趋势数据`);
    }

    // 3. 记录API查询
    console.log('\n📊 记录API查询...');

    const { error: queryError } = await supabase
      .from('api_queries')
      .insert({
        query_type: 'trending',
        region_code: 'US',
        page_number: 1,
        total_results: 200, // 假设收集了200个视频
        query_date: now.toISOString(),
        response_time_ms: Math.floor(Math.random() * 1000) + 500, // 模拟响应时间
        success: true,
        api_version: 'v3'
      });

    if (queryError) {
      console.warn('⚠️ API查询记录失败(表可能不存在或权限不足):', queryError.message);
    } else {
      console.log('✅ API查询记录成功');
    }

    // 4. 显示统计摘要
    console.log('\n📊 时间序列数据创建摘要:');
    console.log(`  📹 视频快照: ${videos?.length || 0} 个`);
    console.log(`  🏷️ Hashtag趋势(小时): ${hashtags?.length || 0} 个`);
    console.log(`  📅 日期: ${today}`);
    console.log(`  ⏰ 时间戳: ${now.toISOString()}`);

    return {
      videoSnapshots: videos?.length || 0,
      hashtagTrends: hashtags?.length || 0,
      date: today
    };

  } catch (error) {
    console.error('💥 时间序列数据创建失败:', error.message);
    throw error;
  }
}

// 查询历史数据
async function queryHistoricalData(days = 7) {
  console.log(`\n📈 查询过去 ${days} 天的历史数据...`);

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  try {
    // 查询hashtag趋势
    const { data: trends } = await supabase
      .from('hashtag_trends')
      .select('trend_date, mention_count, unique_videos, total_views')
      .gte('trend_date', startDate.toISOString().split('T')[0])
      .lte('trend_date', endDate.toISOString().split('T')[0])
      .order('trend_date', { ascending: true });

    if (trends && trends.length > 0) {
      console.log('\n📈 历史Hashtag趋势:');
      trends.forEach((trend, index) => {
        console.log(`  ${trend.trend_date}: ${trend.mention_count}次提及, ${trend.unique_videos}个视频`);
      });
    }

    // 查询视频快照数量
    const { count: snapshotCount } = await supabase
      .from('video_snapshots')
      .select('*', { count: 'exact', head: true })
      .gte('snapshot_date', startDate.toISOString())
      .lte('snapshot_date', endDate.toISOString());

    console.log(`\n📹 历史视频快照数量: ${snapshotCount}`);

    return { trends, snapshotCount };

  } catch (error) {
    console.error('💥 历史数据查询失败:', error.message);
    throw error;
  }
}

// 主函数
async function main() {
  try {
    console.log('🎯 YouTube数据时间序列存储工具');
    console.log('=====================================\n');

    // 创建当前时间序列数据
    const result = await createTimeSeriesData();

    // 查询历史数据
    await queryHistoricalData(7);

    console.log('\n🎉 时间序列数据处理完成!');
    console.log('现在可以通过以下SQL查询获取有价值的数据:');
    console.log('1. Hashtag热度趋势: SELECT * FROM hashtag_trends ORDER BY trend_date DESC, mention_count DESC;');
    console.log('2. 视频性能变化: SELECT * FROM video_snapshots ORDER BY snapshot_date DESC;');
    console.log('3. API查询历史: SELECT * FROM api_queries ORDER BY query_date DESC;');

  } catch (error) {
    console.error('\n💥 处理失败:', error.message);
    process.exit(1);
  }
}

// 运行脚本
main();
