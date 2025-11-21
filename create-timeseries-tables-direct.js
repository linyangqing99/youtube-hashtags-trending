// 直接创建时间序列表的脚本
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://isorrcmivuomzolnaxgi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlzb3JyY21pdnVvbXpvbG5heGdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MDg2NDgsImV4cCI6MjA3OTI4NDY0OH0.5wBVfHSIIxJQiq3NjlI0FY3w2x1WIjyLY8cuFBQhJsA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTimeSeriesTables() {
  console.log('🚀 开始创建时间序列表...');

  try {
    // 1. 检查表是否已存在
    console.log('📋 检查表是否存在...');

    // 注意：由于RLS限制，我们不能直接查询系统表，所以直接尝试创建

    // 2. 创建 video_snapshots 表
    console.log('\n📸 创建 video_snapshots 表...');

    const videoSnapshotsSQL = `
      CREATE TABLE IF NOT EXISTS video_snapshots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
        view_count BIGINT DEFAULT 0,
        like_count BIGINT DEFAULT 0,
        comment_count BIGINT DEFAULT 0,
        snapshot_date TIMESTAMP WITH TIME ZONE NOT NULL,
        ranking_position INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(video_id, snapshot_date)
      );
    `;

    try {
      const { data: videoResult, error: videoError } = await supabase
        .rpc('exec_sql', { sql: videoSnapshotsSQL });

      if (videoError) {
        console.log('⚠️ video_snapshots表创建:', videoError.message);
      } else {
        console.log('✅ video_snapshots表创建成功');
      }
    } catch (err) {
      console.log('⚠️ 尝试通过普通SQL创建video_snapshots表...');

      // 尝试使用普通SQL（可能没有权限）
      const { error: directError } = await supabase
        .from('video_snapshots')
        .select('id')
        .limit(1);

      if (directError && directError.message.includes('does not exist')) {
        console.log('❌ video_snapshots表不存在，需要手动创建');
      } else if (!directError) {
        console.log('✅ video_snapshots表已存在');
      }
    }

    // 3. 创建 hashtag_trends 表
    console.log('\n🏷️ 创建 hashtag_trends 表...');

    const hashtagTrendsSQL = `
      CREATE TABLE IF NOT EXISTS hashtag_trends (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        hashtag_id UUID NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
        mention_count INTEGER DEFAULT 0,
        unique_videos INTEGER DEFAULT 0,
        total_views BIGINT DEFAULT 0,
        avg_views_per_video BIGINT DEFAULT 0,
        trend_date DATE NOT NULL,
        region_code TEXT DEFAULT 'US',
        ranking_position INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(hashtag_id, trend_date, region_code)
      );
    `;

    try {
      const { data: hashtagResult, error: hashtagError } = await supabase
        .rpc('exec_sql', { sql: hashtagTrendsSQL });

      if (hashtagError) {
        console.log('⚠️ hashtag_trends表创建:', hashtagError.message);
      } else {
        console.log('✅ hashtag_trends表创建成功');
      }
    } catch (err) {
      console.log('⚠️ 尝试通过普通SQL检查hashtag_trends表...');

      const { error: directError } = await supabase
        .from('hashtag_trends')
        .select('id')
        .limit(1);

      if (directError && directError.message.includes('does not exist')) {
        console.log('❌ hashtag_trends表不存在，需要手动创建');
      } else if (!directError) {
        console.log('✅ hashtag_trends表已存在');
      }
    }

    // 4. 验证表是否存在
    console.log('\n🔍 验证表结构...');

    try {
      const { data: videoSnapshots, error: vsError } = await supabase
        .from('video_snapshots')
        .select('id')
        .limit(1);

      if (vsError) {
        console.log('❌ video_snapshots表验证失败:', vsError.message);
      } else {
        console.log('✅ video_snapshots表验证成功');
      }
    } catch (err) {
      console.log('❌ video_snapshots表不存在或无法访问');
    }

    try {
      const { data: hashtagTrends, error: htError } = await supabase
        .from('hashtag_trends')
        .select('id')
        .limit(1);

      if (htError) {
        console.log('❌ hashtag_trends表验证失败:', htError.message);
      } else {
        console.log('✅ hashtag_trends表验证成功');
      }
    } catch (err) {
      console.log('❌ hashtag_trends表不存在或无法访问');
    }

    // 5. 输出手动创建指南
    console.log('\n📝 手动创建指南:');
    console.log('如果表创建失败，请按以下步骤手动创建:');
    console.log('1. 访问 https://app.supabase.com/project/isorrcmivuomzolnaxgi/sql');
    console.log('2. 复制并执行以下SQL:');
    console.log('\n-- 创建 video_snapshots 表');
    console.log('CREATE TABLE video_snapshots (');
    console.log('  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),');
    console.log('  video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,');
    console.log('  view_count BIGINT DEFAULT 0,');
    console.log('  like_count BIGINT DEFAULT 0,');
    console.log('  comment_count BIGINT DEFAULT 0,');
    console.log('  snapshot_date TIMESTAMP WITH TIME ZONE NOT NULL,');
    console.log('  ranking_position INTEGER,');
    console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
    console.log('  UNIQUE(video_id, snapshot_date)');
    console.log(');');
    console.log('\n-- 创建 hashtag_trends 表');
    console.log('CREATE TABLE hashtag_trends (');
    console.log('  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),');
    console.log('  hashtag_id UUID NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,');
    console.log('  mention_count INTEGER DEFAULT 0,');
    console.log('  unique_videos INTEGER DEFAULT 0,');
    console.log('  total_views BIGINT DEFAULT 0,');
    console.log('  avg_views_per_video BIGINT DEFAULT 0,');
    console.log('  trend_date DATE NOT NULL,');
    console.log('  region_code TEXT DEFAULT \'US\',');
    console.log('  ranking_position INTEGER,');
    console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
    console.log('  UNIQUE(hashtag_id, trend_date, region_code)');
    console.log(');');

  } catch (error) {
    console.error('💥 创建表时出错:', error.message);
  }
}

// 运行脚本
createTimeSeriesTables();