# 时间序列数据表设置指南

## 概述

为了解决多轮查询数据存储的问题，我们需要创建两个时间序列表：
- `video_snapshots` - 记录视频在不同时间点的状态和排名
- `hashtag_trends` - 记录hashtag的日级趋势数据
- `hashtag_trends_hourly` - 记录hashtag的小时级趋势数据（新增，用于“最近7小时”）

## 多轮查询数据存储问题解答

### 当前问题
1. **数据覆盖**：每次查询相同视频时会更新`videos`表，丢失历史信息
2. **排名丢失**：无法记录视频在热门榜单中的历史排名
3. **趋势缺失**：无法追踪hashtag的热度变化趋势

### 解决方案
通过时间序列表，我们可以：
1. **完整记录历史**：每次查询都创建快照，保留完整历史数据
2. **排名追踪**：记录每个视频在每个时间点的排名位置
3. **趋势分析**：分析hashtag的热度变化和视频的成长趋势

## 手动创建时间序列表

### 步骤 1：访问 Supabase Dashboard

1. 打开浏览器，访问：https://app.supabase.com
2. 选择您的项目：`isorrcmivuomzolnaxgi`
3. 点击左侧菜单的 "SQL Editor"

### 步骤 2：执行 SQL 脚本

复制以下完整的SQL脚本，粘贴到SQL编辑器中并执行：

```sql
-- ========================================
-- 创建时间序列数据表 (兼容现有integer主键)
-- 项目：YouTube Hashtags Trending
-- 执行时间：2025-11-21
-- 注意：此版本兼容现有的integer主键hashtags表
-- ========================================

-- 1. 创建 video_snapshots 表
CREATE TABLE video_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  view_count BIGINT DEFAULT 0,
  like_count BIGINT DEFAULT 0,
  comment_count BIGINT DEFAULT 0,
  snapshot_date TIMESTAMP WITH TIME ZONE NOT NULL,
  ranking_position INTEGER, -- 在热门视频中的排名位置
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(video_id, snapshot_date)
);

-- 2. 创建 hashtag_trends 表 (使用integer外键)
CREATE TABLE hashtag_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hashtag_id INTEGER NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
  mention_count INTEGER DEFAULT 0, -- 在当前热门视频中出现的总次数
  unique_videos INTEGER DEFAULT 0, -- 关联的独特视频数量
  total_views BIGINT DEFAULT 0, -- 关联视频的总观看数
  avg_views_per_video BIGINT DEFAULT 0, -- 每个视频平均观看数
  trend_date DATE NOT NULL,
  region_code TEXT DEFAULT 'US',
  ranking_position INTEGER, -- 在hashtag热门度排名中的位置
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(hashtag_id, trend_date, region_code)
);

-- 3. 创建索引以提高查询性能
CREATE INDEX idx_video_snapshots_video_id ON video_snapshots(video_id);
CREATE INDEX idx_video_snapshots_snapshot_date ON video_snapshots(snapshot_date);
CREATE INDEX idx_video_snapshots_ranking ON video_snapshots(ranking_position);

CREATE INDEX idx_hashtag_trends_hashtag_id ON hashtag_trends(hashtag_id);
CREATE INDEX idx_hashtag_trends_trend_date ON hashtag_trends(trend_date);
CREATE INDEX idx_hashtag_trends_ranking ON hashtag_trends(ranking_position);
CREATE INDEX idx_hashtag_trends_region_code ON hashtag_trends(region_code);

-- 2.1 创建小时级 hashtag 趋势表
CREATE TABLE IF NOT EXISTS hashtag_trends_hourly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hashtag_id INTEGER NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
  mention_count INTEGER DEFAULT 0,
  unique_videos INTEGER DEFAULT 0,
  total_views BIGINT DEFAULT 0,
  avg_views_per_video BIGINT DEFAULT 0,
  trend_at TIMESTAMP WITH TIME ZONE NOT NULL,
  region_code TEXT DEFAULT 'US',
  ranking_position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(hashtag_id, trend_at, region_code)
);

CREATE INDEX IF NOT EXISTS idx_hashtag_trends_hourly_hashtag_id ON hashtag_trends_hourly(hashtag_id);
CREATE INDEX IF NOT EXISTS idx_hashtag_trends_hourly_trend_at ON hashtag_trends_hourly(trend_at DESC);
CREATE INDEX IF NOT EXISTS idx_hashtag_trends_hourly_region_code ON hashtag_trends_hourly(region_code, trend_at DESC);
CREATE INDEX IF NOT EXISTS idx_hashtag_trends_hourly_ranking ON hashtag_trends_hourly(ranking_position);

-- 4. 启用行级安全性 (RLS)
ALTER TABLE video_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtag_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtag_trends_hourly ENABLE ROW LEVEL SECURITY;

-- 5. 创建 RLS 策略
CREATE POLICY "Public can read video_snapshots" ON video_snapshots FOR SELECT USING (true);
CREATE POLICY "Public can read hashtag_trends" ON hashtag_trends FOR SELECT USING (true);
CREATE POLICY "Public can read hashtag_trends_hourly" ON hashtag_trends_hourly FOR SELECT USING (true);

CREATE POLICY "Service can insert video_snapshots" ON video_snapshots FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can update video_snapshots" ON video_snapshots FOR UPDATE USING (true);

CREATE POLICY "Service can insert hashtag_trends" ON hashtag_trends FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can update hashtag_trends" ON hashtag_trends FOR UPDATE USING (true);

CREATE POLICY "Service can insert hashtag_trends_hourly" ON hashtag_trends_hourly FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can update hashtag_trends_hourly" ON hashtag_trends_hourly FOR UPDATE USING (true);

-- 6. 验证表创建成功
SELECT 'video_snapshots 表创建成功!' as status;
SELECT COUNT(*) as video_snapshots_count FROM video_snapshots;
SELECT 'hashtag_trends 表创建成功!' as status;
SELECT COUNT(*) as hashtag_trends_count FROM hashtag_trends;
```

### 步骤 3：验证表创建成功

执行完成后，您应该看到类似这样的输出：
```
video_snapshots 表创建成功!
hashtag_trends 表创建成功!
```

## 测试时间序列功能

表创建成功后，您可以运行时间序列数据创建脚本来测试：

```bash
cd "/Users/clean./Documents/youtube hashtags trending /youtube-hashtags-nextjs"
node create-time-series-data.js
```

## 数据存储逻辑说明

### video_snapshots 表
- **作用**：记录每个视频在特定时间点的完整状态
- **关键字段**：
  - `video_id`: 视频唯一标识
  - `snapshot_date`: 快照时间戳（查询时间）
  - `ranking_position`: 当时在热门榜单中的排名
  - `view_count`, `like_count`, `comment_count`: 当时的统计数据

### hashtag_trends 表
- **作用**：记录hashtag在特定日期的热度趋势
- **关键字段**：
  - `hashtag_id`: Hashtag唯一标识
  - `trend_date`: 趋势日期
  - `mention_count`: 在当天的热门视频中出现的总次数
  - `unique_videos`: 关联的独特视频数量
  - `ranking_position`: 在hashtag热度排名中的位置

## 使用示例

### 查询视频排名变化
```sql
-- 查询某个视频的排名历史
SELECT
  video_id,
  snapshot_date,
  ranking_position,
  view_count,
  like_count
FROM video_snapshots
WHERE video_id = 'your_video_id'
ORDER BY snapshot_date DESC;
```

### 查询Hashtag日级趋势
```sql
-- 查询某个hashtag的趋势历史
SELECT
  h.name,
  ht.trend_date,
  ht.mention_count,
  ht.unique_videos,
  ht.ranking_position
FROM hashtag_trends ht
JOIN hashtags h ON h.id = ht.hashtag_id
WHERE h.name = 'your_hashtag'
ORDER BY ht.trend_date DESC;
```

### 查询Hashtag小时级趋势
```sql
SELECT
  h.name,
  ht.trend_at,
  ht.mention_count,
  ht.unique_videos,
  ht.ranking_position
FROM hashtag_trends_hourly ht
JOIN hashtags h ON h.id = ht.hashtag_id
WHERE h.name = 'your_hashtag'
ORDER BY ht.trend_at DESC;
```

## 下一步

表创建成功后，您可以：
1. 运行 `node create-time-series-data.js` 创建第一批时间序列数据
2. 设置定时任务每12小时收集一次数据
3. 开发热力图展示页面

## 故障排除

如果遇到问题：
1. 确保您有足够权限执行DDL语句
2. 检查外键约束是否正确（videos表和hashtags表必须存在）
3. 如果表名冲突，可以先删除旧表：`DROP TABLE IF EXISTS video_snapshots;`

---

**创建时间**: 2025-11-21
**项目**: YouTube Hashtags Trending
**维护**: 请根据需要更新此文档
