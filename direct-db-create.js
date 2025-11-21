const { Client } = require('pg');
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

console.log('环境变量检查:');
console.log('- Supabase URL:', env.NEXT_PUBLIC_SUPABASE_URL);
console.log('- Service Key exists:', !!env.SUPABASE_SERVICE_ROLE_KEY);

// 构建连接字符串
// Supabase连接格式: postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
const projectId = env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');

// 尝试多种连接字符串格式
const connectionStrings = [
  `postgresql://postgres:${env.SUPABASE_SERVICE_ROLE_KEY}@db.${projectId}.supabase.co:5432/postgres`,
  `postgresql://postgres.${projectId}:${env.SUPABASE_SERVICE_ROLE_KEY}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres:${env.SUPABASE_SERVICE_ROLE_KEY}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${projectId}:${env.SUPABASE_SERVICE_ROLE_KEY}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
];

console.log('\n项目ID:', projectId);

async function createTables() {
  let client = null;
  let connected = false;

  // 尝试不同的连接字符串
  for (let i = 0; i < connectionStrings.length; i++) {
    const connectionString = connectionStrings[i];
    console.log(`\n尝试连接字符串 ${i + 1}/${connectionStrings.length}:`);
    console.log(connectionString.replace(env.SUPABASE_SERVICE_ROLE_KEY, '[SERVICE_KEY]'));

    try {
      client = new Client({
        connectionString: connectionString,
        ssl: {
          rejectUnauthorized: false
        }
      });

      await client.connect();
      connected = true;
      console.log('✅ 数据库连接成功！');
      break;
    } catch (error) {
      console.log(`❌ 连接失败: ${error.message}`);
      if (client) {
        try {
          await client.end();
        } catch (endError) {
          // 忽略关闭错误
        }
        client = null;
      }
    }
  }

  if (!connected) {
    console.error('\n❌ 所有连接尝试都失败了');
    return;
  }

  try {

    // 检查现有表
    console.log('\n检查现有表结构...');
    const { rows: existingTables } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('video_snapshots', 'hashtag_trends')
    `);

    console.log('现有表:', existingTables.map(t => t.table_name));

    // 创建video_snapshots表
    console.log('\n创建video_snapshots表...');
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

    await client.query(createVideoSnapshotsSQL);
    console.log('✅ video_snapshots表创建成功！');

    // 创建hashtag_trends表
    console.log('\n创建hashtag_trends表...');
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

    await client.query(createHashtagTrendsSQL);
    console.log('✅ hashtag_trends表创建成功！');

    // 验证表创建
    console.log('\n验证表创建状态...');
    const { rows: newTables } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('video_snapshots', 'hashtag_trends')
    `);

    console.log('创建后的表:', newTables.map(t => t.table_name));

    // 显示表结构
    for (const tableName of newTables.map(t => t.table_name)) {
      console.log(`\n${tableName} 表结构:`);
      const { rows: columns } = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable})${col.column_default ? ` Default: ${col.column_default}` : ''}`);
      });
    }

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error('详细错误:', error);
  } finally {
    await client.end();
    console.log('\n数据库连接已关闭');
  }
}

createTables().catch(console.error);