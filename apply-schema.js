const fs = require('fs');
const path = require('path');

// 读取环境变量
const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim();
  }
});

console.log('准备应用数据库架构更新...');
console.log('Supabase URL:', env.NEXT_PUBLIC_SUPABASE_URL);

// 读取SQL文件
const sqlFile = path.join(__dirname, 'lib', 'supabase.sql');
const sqlContent = fs.readFileSync(sqlFile, 'utf8');

console.log('\nSQL文件已读取，包含以下表:');
const tableMatches = sqlContent.match(/CREATE TABLE (\w+)/g);
if (tableMatches) {
  tableMatches.forEach(match => {
    const tableName = match.replace('CREATE TABLE ', '');
    console.log('  -', tableName);
  });
}

// 创建指导信息
console.log('\n=== 数据库表创建指南 ===');
console.log('由于无法直接通过代码执行DDL语句，请按照以下步骤手动创建表：');
console.log('\n1. 访问您的Supabase项目控制台:');
console.log('   https://app.supabase.com');
console.log('\n2. 选择项目:', env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', '.supabase.co'));

console.log('\n3. 进入 SQL Editor:');
console.log('   在左侧菜单中点击 "SQL Editor"');

console.log('\n4. 执行以下SQL语句：');

// 提取表创建语句
const videoSnapshotsMatch = sqlContent.match(/-- 创建视频历史记录表[\s\S]*?\);/);
const hashtagTrendsMatch = sqlContent.match(/-- 创建hashtag热度历史表[\s\S]*?\);/);
const hashtagsMatch = sqlContent.match(/-- 创建hashtag表[\s\S]*?\);/);
const videoHashtagsMatch = sqlContent.match(/-- 创建视频hashtag关联表[\s\S]*?\);/);

console.log('\n--- 首先更新hashtags表 (如果已存在需要DROP和RECREATE) ---');
if (hashtagsMatch) {
  console.log('-- 如果表已存在，先删除');
  console.log('DROP TABLE IF EXISTS video_hashtags CASCADE;');
  console.log('DROP TABLE IF EXISTS hashtag_trends CASCADE;');
  console.log('DROP TABLE IF EXISTS hashtags CASCADE;');
  console.log('\n-- 然后创建新表');
  console.log(hashtagsMatch[0]);
}

console.log('\n--- 创建video_hashtags表 ---');
if (videoHashtagsMatch) {
  console.log(videoHashtagsMatch[0]);
}

console.log('\n--- 创建video_snapshots表 ---');
if (videoSnapshotsMatch) {
  console.log(videoSnapshotsMatch[0]);
}

console.log('\n--- 创建hashtag_trends表 ---');
if (hashtagTrendsMatch) {
  console.log(hashtagTrendsMatch[0]);
}

console.log('\n5. 验证表创建:');
console.log('   执行完成后，在左侧的 "Table Editor" 中应该能看到新创建的表');

console.log('\n=== 完整SQL语句已保存到文件供复制 ===');
const createTablesSQL = `
-- 更新hashtags表 (UUID主键)
DROP TABLE IF EXISTS video_hashtags CASCADE;
DROP TABLE IF EXISTS hashtag_trends CASCADE;
DROP TABLE IF EXISTS hashtags CASCADE;

CREATE TABLE hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_mentions INTEGER DEFAULT 0,
  total_videos INTEGER DEFAULT 0,
  total_views BIGINT DEFAULT 0,
  quality_score INTEGER DEFAULT 0,
  is_blocked BOOLEAN DEFAULT FALSE,
  block_reason VARCHAR(100),
  last_mention_date TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建video_hashtags表
CREATE TABLE video_hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id VARCHAR(20) NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  hashtag_id UUID NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
  source VARCHAR(20) NOT NULL CHECK (source IN ('title', 'description', 'tags', 'extracted')),
  position INTEGER,
  confidence_score FLOAT DEFAULT 1.0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(video_id, hashtag_id, source)
);

-- 创建video_snapshots表
CREATE TABLE video_snapshots (
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

-- 创建hashtag_trends表
CREATE TABLE hashtag_trends (
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

// 保存SQL到文件
fs.writeFileSync(path.join(__dirname, 'create-uuid-tables.sql'), createTablesSQL);
console.log('\n✅ 完整SQL已保存到: create-uuid-tables.sql');
console.log('\n请复制上述SQL语句到Supabase SQL Editor中执行，或者直接使用生成的SQL文件。');