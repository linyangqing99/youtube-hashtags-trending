-- 更新时间序列表结构以匹配新需求
-- 执行时间：2025-11-21

-- 注意：由于涉及外键约束，需要先删除现有表然后重新创建
-- 这会丢失现有数据，请在生产环境中先备份数据！

-- 1. 删除现有的时间序列表
DROP TABLE IF EXISTS video_snapshots CASCADE;
DROP TABLE IF EXISTS hashtag_trends CASCADE;

-- 2. 创建新的 video_snapshots 表
CREATE TABLE video_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  snapshot_date TIMESTAMP WITH TIME ZONE NOT NULL,
  ranking_position INTEGER, -- 在热门视频中的排名位置
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(video_id, snapshot_date)
);

-- 3. 创建新的 hashtag_trends 表
CREATE TABLE hashtag_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hashtag_id UUID NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
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

-- 4. 创建索引以提高查询性能

-- video_snapshots 表索引
CREATE INDEX idx_video_snapshots_video_id ON video_snapshots(video_id);
CREATE INDEX idx_video_snapshots_snapshot_date ON video_snapshots(snapshot_date);
CREATE INDEX idx_video_snapshots_ranking ON video_snapshots(ranking_position);
CREATE INDEX idx_video_snapshots_video_snapshot_date ON video_snapshots(video_id, snapshot_date DESC);

-- hashtag_trends 表索引
CREATE INDEX idx_hashtag_trends_hashtag_id ON hashtag_trends(hashtag_id);
CREATE INDEX idx_hashtag_trends_trend_date ON hashtag_trends(trend_date);
CREATE INDEX idx_hashtag_trends_ranking ON hashtag_trends(ranking_position);
CREATE INDEX idx_hashtag_trends_region_code ON hashtag_trends(region_code);
CREATE INDEX idx_hashtag_trends_hashtag_date ON hashtag_trends(hashtag_id, trend_date DESC);
CREATE INDEX idx_hashtag_trends_date_ranking ON hashtag_trends(trend_date DESC, ranking_position);

-- 5. 启用行级安全性 (RLS)
ALTER TABLE video_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtag_trends ENABLE ROW LEVEL SECURITY;

-- 6. 创建基本RLS策略
CREATE POLICY "Public can read video_snapshots" ON video_snapshots FOR SELECT USING (true);
CREATE POLICY "Public can read hashtag_trends" ON hashtag_trends FOR SELECT USING (true);

-- 7. 创建插入策略（允许服务端插入）
CREATE POLICY "Service can insert video_snapshots" ON video_snapshots FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can insert hashtag_trends" ON hashtag_trends FOR INSERT WITH CHECK (true);

-- 8. 更新策略（允许服务端更新）
CREATE POLICY "Service can update video_snapshots" ON video_snapshots FOR UPDATE USING (true);
CREATE POLICY "Service can update hashtag_trends" ON hashtag_trends FOR UPDATE USING (true);

-- 9. 创建聚合视图以便于查询
CREATE OR REPLACE VIEW hashtag_trend_summary AS
SELECT
  h.id as hashtag_id,
  h.name as hashtag_name,
  ht.trend_date,
  ht.region_code,
  ht.mention_count,
  ht.unique_videos,
  ht.total_views,
  ht.avg_views_per_video,
  ht.ranking_position,
  h.quality_score,
  h.total_mentions as historical_mentions,
  h.total_views as historical_views,
  ROW_NUMBER() OVER (PARTITION BY ht.trend_date, ht.region_code ORDER BY ht.mention_count DESC) as daily_rank
FROM hashtag_trends ht
JOIN hashtags h ON h.id = ht.hashtag_id
WHERE ht.trend_date >= CURRENT_DATE - INTERVAL '30 days';

-- 10. 创建视频快照聚合视图
CREATE OR REPLACE VIEW video_trend_summary AS
SELECT
  v.id as video_id,
  v.title,
  v.channel_id,
  c.title as channel_title,
  vs.snapshot_date,
  vs.view_count,
  vs.like_count,
  vs.comment_count,
  vs.ranking_position,
  v.published_at,
  EXTRACT(DAY FROM vs.snapshot_date - v.published_at) as days_since_publish,
  CASE
    WHEN vs.view_count > 0 AND LAG(vs.view_count) OVER (PARTITION BY v.id ORDER BY vs.snapshot_date) > 0
    THEN ROUND(((vs.view_count - LAG(vs.view_count) OVER (PARTITION BY v.id ORDER BY vs.snapshot_date))::float /
               LAG(vs.view_count) OVER (PARTITION BY v.id ORDER BY vs.snapshot_date)) * 100, 2)
    ELSE NULL
  END as view_growth_rate_percent
FROM video_snapshots vs
JOIN videos v ON v.id = vs.video_id
JOIN channels c ON c.id = v.channel_id
WHERE vs.snapshot_date >= CURRENT_DATE - INTERVAL '7 days';

-- 完成！