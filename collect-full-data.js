// 收集美国地区前200个热门视频的完整数据
const { createClient } = require('@supabase/supabase-js');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// 配置
const YOUTUBE_API_KEY = 'AIzaSyBjCrXhXREadzz0jURS-TzDYwSrdb_hUqo';
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';
const supabaseUrl = 'https://isorrcmivuomzolnaxgi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlzb3JyY21pdnVvbXpvbG5heGdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MDg2NDgsImV4cCI6MjA3OTI4NDY0OH0.5wBVfHSIIxJQiq3NjlI0FY3w2x1WIjyLY8cuFBQhJsA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 简单的hashtag提取函数
function extractHashtags(text) {
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  const matches = Array.from(text.matchAll(hashtagRegex));
  return matches.map(match => match[1].toLowerCase());
}

// 获取单页数据
async function fetchPage(pageToken = null, maxResults = 50) {
  let url = `${YOUTUBE_API_BASE_URL}/videos?part=snippet,statistics&chart=mostPopular&regionCode=US&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`;
  if (pageToken) {
    url += `&pageToken=${pageToken}`;
  }

  const { stdout, stderr } = await execAsync(`curl --location '${url}'`, {
    timeout: 30000,
    env: {
      ...process.env,
      https_proxy: 'http://127.0.0.1:7890',
      http_proxy: 'http://127.0.0.1:7890',
      all_proxy: 'socks5://127.0.0.1:7890'
    }
  });

  if (stderr && stderr.trim() && !stdout) {
    throw new Error(`curl执行失败: ${stderr}`);
  }

  return JSON.parse(stdout);
}

// 保存视频数据到数据库
async function saveVideoData(video) {
  const videoData = {
    id: video.id,
    title: video.snippet?.title || '',
    description: video.snippet?.description || '',
    channel_title: video.snippet?.channelTitle || '',
    view_count: parseInt(video.statistics?.viewCount || '0'),
    like_count: parseInt(video.statistics?.likeCount || '0'),
    comment_count: parseInt(video.statistics?.commentCount || '0'),
    published_at: video.snippet?.publishedAt || null,
    tags: video.snippet?.tags || []
  };

  const { data: videoResult, error: videoError } = await supabase
    .from('videos')
    .upsert(videoData, { onConflict: 'id' })
    .select()
    .single();

  if (videoError) {
    throw new Error(`视频保存失败 (${video.id}): ${videoError.message}`);
  }

  return videoResult;
}

// 保存hashtag和关联数据
async function saveHashtagRelations(video, videoId) {
  const titleHashtags = extractHashtags(video.title);
  const descriptionHashtags = extractHashtags(video.description);
  const allHashtags = [...new Set([...titleHashtags, ...descriptionHashtags])];

  let savedHashtags = 0;
  let savedRelations = 0;
  const errors = [];

  for (const hashtagName of allHashtags) {
    if (hashtagName.length < 2 || hashtagName.length > 50) {
      continue; // 过滤无效hashtag
    }

    try {
      // 插入或更新hashtag
      const { data: hashtagResult, error: hashtagError } = await supabase
        .from('hashtags')
        .upsert({ name: hashtagName }, { onConflict: 'name' })
        .select()
        .single();

      if (hashtagError) {
        errors.push(`Hashtag保存失败 (${hashtagName}): ${hashtagError.message}`);
        continue;
      }

      savedHashtags++;

      // 创建视频-hashtag关联
      const source = titleHashtags.includes(hashtagName) ? 'title' : 'description';
      const { error: relationError } = await supabase
        .from('video_hashtags')
        .upsert({
          video_id: videoId,
          hashtag_id: hashtagResult.id,
          source
        }, { onConflict: 'video_id,hashtag_id' });

      if (relationError) {
        errors.push(`关联保存失败 (${videoId}-${hashtagName}): ${relationError.message}`);
      } else {
        savedRelations++;
      }
    } catch (error) {
      errors.push(`处理hashtag失败 (${hashtagName}): ${error.message}`);
    }
  }

  return { savedHashtags, savedRelations, errors };
}

// 主收集函数
async function collectAllData() {
  console.log('🚀 开始收集美国地区前200个热门视频数据...');
  console.log('================================================\n');

  let allVideos = [];
  let allHashtags = new Set();
  let totalStats = {
    videos: 0,
    hashtags: 0,
    relations: 0,
    errors: []
  };

  const startTime = Date.now();

  try {
    let pageToken = null;
    let pageNumber = 1;

    // YouTube API每页最多50个结果，200个结果需要4页
    while (pageNumber <= 4) {
      console.log(`📥 获取第 ${pageNumber} 页数据...`);

      const response = await fetchPage(pageToken);
      const items = response.items || [];

      if (items.length === 0) {
        console.log('⚠️ 没有更多数据了');
        break;
      }

      console.log(`✅ 第 ${pageNumber} 页获取到 ${items.length} 个视频`);

      // 处理当前页的所有视频
      for (let i = 0; i < items.length; i++) {
        const video = items[i];
        const videoIndex = allVideos.length + 1;

        console.log(`\n📹 [${videoIndex}/200] 处理: ${video.snippet?.title?.substring(0, 50)}...`);

        try {
          // 保存视频数据
          await saveVideoData(video);
          totalStats.videos++;

          // 保存hashtag和关联
          const hashtagResult = await saveHashtagRelations(
            {
              title: video.snippet?.title || '',
              description: video.snippet?.description || ''
            },
            video.id
          );

          totalStats.hashtags += hashtagResult.savedHashtags;
          totalStats.relations += hashtagResult.savedRelations;
          totalStats.errors.push(...hashtagResult.errors);

          // 收集hashtag名称用于统计
          const titleHashtags = extractHashtags(video.snippet?.title || '');
          const descriptionHashtags = extractHashtags(video.snippet?.description || '');
          [...titleHashtags, ...descriptionHashtags].forEach(h => allHashtags.add(h));

          console.log(`  ✅ 视频保存成功`);
          if (hashtagResult.savedHashtags > 0) {
            console.log(`  ✅ ${hashtagResult.savedHashtags} 个hashtag, ${hashtagResult.savedRelations} 个关联`);
          }

        } catch (error) {
          console.error(`❌ 处理视频失败 (${video.id}):`, error.message);
          totalStats.errors.push(`视频处理失败 (${video.id}): ${error.message}`);
        }
      }

      allVideos.push(...items);
      pageToken = response.nextPageToken;
      pageNumber++;

      // 添加请求间隔避免频率限制
      if (pageNumber <= 4) {
        console.log('⏱️ 等待1秒避免API频率限制...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    // 输出最终统计
    console.log('\n🎉 数据收集完成!');
    console.log('=================');
    console.log(`📊 收集统计:`);
    console.log(`  📹 视频数量: ${totalStats.videos}`);
    console.log(`  🏷️ Hashtag数量: ${totalStats.hashtags}`);
    console.log(`  🔗 关联数量: ${totalStats.relations}`);
    console.log(`  ⏱️ 总耗时: ${duration.toFixed(2)}秒`);
    console.log(`  🔥 唯一Hashtag总数: ${allHashtags.size}`);

    if (totalStats.errors.length > 0) {
      console.log(`\n⚠️ 错误数量: ${totalStats.errors.length}`);
      totalStats.errors.slice(0, 5).forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
      if (totalStats.errors.length > 5) {
        console.log(`  ... 还有 ${totalStats.errors.length - 5} 个错误`);
      }
    }

    // 查询最终数据库状态
    console.log('\n🔍 数据库最终状态:');
    const { count: hashtagCount } = await supabase
      .from('hashtags')
      .select('*', { count: 'exact', head: true });

    const { count: videoCount } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true });

    const { count: relationCount } = await supabase
      .from('video_hashtags')
      .select('*', { count: 'exact', head: true });

    console.log(`📝 总Hashtag数量: ${hashtagCount || 0}`);
    console.log(`📹 总视频数量: ${videoCount || 0}`);
    console.log(`🔗 总关联数量: ${relationCount || 0}`);

    // 显示前10个热门hashtag
    console.log('\n🔥 前10个热门hashtag (按数量排序):');
    const { data: topHashtags } = await supabase
      .from('hashtags')
      .select('*')
      .order('count', { ascending: false })
      .limit(10);

    topHashtags.forEach((hashtag, index) => {
      console.log(`  ${index + 1}. ${hashtag.name} (${hashtag.count}次)`);
    });

    return totalStats;

  } catch (error) {
    console.error('\n💥 数据收集失败:', error.message);
    throw error;
  }
}

// 主函数
async function main() {
  console.log('🎯 YouTube美国地区前200热门视频完整收集工具');
  console.log('================================================\n');

  try {
    const result = await collectAllData();
    console.log('\n🎉 成功收集完整数据! 现在可以开始hashtag分析了!');
  } catch (error) {
    console.error('\n💥 收集失败:', error.message);
    process.exit(1);
  }
}

// 运行脚本
main();