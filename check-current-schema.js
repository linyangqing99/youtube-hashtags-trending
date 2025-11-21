// 检查当前数据库表结构
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://isorrcmivuomzolnaxgi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlzb3JyY21pdnVvbXpvbG5heGdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MDg2NDgsImV4cCI6MjA3OTI4NDY0OH0.5wBVfHSIIxJQiq3NjlI0FY3w2x1WIjyLY8cuFBQhJsA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  console.log('🔍 检查当前数据库表结构...');

  try {
    // 检查 hashtags 表结构
    console.log('\n📋 检查 hashtags 表...');
    const { data: hashtagsData, error: hashtagsError } = await supabase
      .from('hashtags')
      .select('id, name, count')
      .limit(1);

    if (hashtagsError) {
      console.log('❌ hashtags 表错误:', hashtagsError.message);
    } else {
      console.log('✅ hashtags 表存在');
      if (hashtagsData && hashtagsData.length > 0) {
        const sample = hashtagsData[0];
        console.log('📝 hashtags 表样本数据:');
        console.log('  id 类型:', typeof sample.id, '值:', sample.id);
        console.log('  name:', sample.name);
        console.log('  count:', sample.count);
      }
    }

    // 检查 video_hashtags 表结构
    console.log('\n📋 检查 video_hashtags 表...');
    const { data: relationsData, error: relationsError } = await supabase
      .from('video_hashtags')
      .select('video_id, hashtag_id')
      .limit(1);

    if (relationsError) {
      console.log('❌ video_hashtags 表错误:', relationsError.message);
    } else {
      console.log('✅ video_hashtags 表存在');
      if (relationsData && relationsData.length > 0) {
        const sample = relationsData[0];
        console.log('📝 video_hashtags 表样本数据:');
        console.log('  video_id 类型:', typeof sample.video_id, '值:', sample.video_id);
        console.log('  hashtag_id 类型:', typeof sample.hashtag_id, '值:', sample.hashtag_id);
      }
    }

    // 获取表的基本统计信息
    console.log('\n📊 数据库统计信息:');

    const { count: hashtagsCount } = await supabase
      .from('hashtags')
      .select('*', { count: 'exact', head: true });

    const { count: videosCount } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true });

    const { count: relationsCount } = await supabase
      .from('video_hashtags')
      .select('*', { count: 'exact', head: true });

    console.log(`  🏷️ hashtags: ${hashtagsCount || 0} 条`);
    console.log(`  📹 videos: ${videosCount || 0} 条`);
    console.log(`  🔗 video_hashtags: ${relationsCount || 0} 条`);

  } catch (error) {
    console.error('💥 检查失败:', error.message);
  }
}

// 运行检查
checkSchema();