const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('缺少必要的环境变量');
  process.exit(1);
}

// 使用服务角色密钥创建客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL(sql, description) {
  console.log(`\n执行: ${description}`);
  console.log(`SQL: ${sql}`);

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error(`❌ 错误: ${error.message}`);
      if (error.details) {
        console.error(`详情: ${error.details}`);
      }
      return false;
    }

    console.log(`✅ 成功: ${description}`);
    return true;
  } catch (err) {
    console.error(`❌ 异常: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('开始执行数据库创建脚本...\n');

  // 首先检查表是否已存在
  console.log('检查现有表结构...');

  // 创建video_snapshots表的SQL
  const createVideoSnapshotsSQL = `
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

  // 创建hashtag_trends表的SQL
  const createHashtagTrendsSQL = `
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

  // 执行创建表的SQL
  await executeSQL(createVideoSnapshotsSQL, '创建video_snapshots表');
  await executeSQL(createHashtagTrendsSQL, '创建hashtag_trends表');

  console.log('\n脚本执行完成！');
}

main().catch(console.error);