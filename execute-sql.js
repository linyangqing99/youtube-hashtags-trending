const { createClient } = require('@supabase/supabase-js');

// 加载环境变量
const fs = require('fs');
const path = require('path');

// 读取.env.local文件
const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Service Key exists:', !!supabaseServiceKey);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('缺少必要的环境变量');
  process.exit(1);
}

// 创建数据库连接
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQLviaSQLFunction() {
  console.log('\n尝试通过Supabase SQL执行器创建表...');

  try {
    // 创建一个用于执行SQL的函数（如果不存在）
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
      RETURNS TABLE(result text) AS $$
      BEGIN
        EXECUTE sql_query;
        RETURN NEXT 'SQL executed successfully'::text;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    console.log('创建SQL执行函数...');
    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql_query: createFunctionSQL
    });

    if (functionError && !functionError.message.includes('does not exist')) {
      console.log('函数创建结果:', functionError.message);
    }

    // 现在执行创建表的SQL
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

    // 执行SQL
    console.log('\n执行video_snapshots表创建...');
    const { data: videoResult, error: videoError } = await supabase
      .rpc('exec_sql', { sql_query: createVideoSnapshotsSQL });

    if (videoError) {
      console.error('video_snapshots创建失败:', videoError);
    } else {
      console.log('✅ video_snapshots表创建成功');
    }

    console.log('\n执行hashtag_trends表创建...');
    const { data: hashtagResult, error: hashtagError } = await supabase
      .rpc('exec_sql', { sql_query: createHashtagTrendsSQL });

    if (hashtagError) {
      console.error('hashtag_trends创建失败:', hashtagError);
    } else {
      console.log('✅ hashtag_trends表创建成功');
    }

  } catch (error) {
    console.error('执行SQL时发生错误:', error);
  }
}

async function tryDirectApproach() {
  console.log('\n尝试直接连接数据库...');

  // 尝试直接查询现有表结构
  try {
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['video_snapshots', 'hashtag_trends']);

    if (error) {
      console.log('直接查询失败，尝试其他方法:', error.message);
      return false;
    }

    console.log('现有表:', tables);
    return true;
  } catch (error) {
    console.error('直接方法失败:', error.message);
    return false;
  }
}

async function main() {
  console.log('开始执行数据库表创建脚本...\n');

  // 先尝试直接方法
  const directSuccess = await tryDirectApproach();

  if (!directSuccess) {
    // 如果直接方法失败，尝试SQL函数方法
    await executeSQLviaSQLFunction();
  }

  // 验证表是否创建成功
  console.log('\n验证表创建状态...');
  try {
    const { data: videoSnapshots, error: videoError } = await supabase
      .from('video_snapshots')
      .select('*')
      .limit(1);

    if (videoError) {
      console.log('video_snapshots表验证失败:', videoError.message);
    } else {
      console.log('✅ video_snapshots表存在且可访问');
    }

    const { data: hashtagTrends, error: hashtagError } = await supabase
      .from('hashtag_trends')
      .select('*')
      .limit(1);

    if (hashtagError) {
      console.log('hashtag_trends表验证失败:', hashtagError.message);
    } else {
      console.log('✅ hashtag_trends表存在且可访问');
    }

  } catch (error) {
    console.error('表验证过程中发生错误:', error);
  }

  console.log('\n脚本执行完成！');
}

main().catch(console.error);