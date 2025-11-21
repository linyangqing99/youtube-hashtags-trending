-- 创建时间序列表脚本
-- 执行日期：2025-11-21
-- 项目：YouTube Hashtags Trending

-- 1. 创建 video_snapshots 表
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

-- 创建 video_snapshots 表的索引
CREATE INDEX idx_video_snapshots_video_id ON video_snapshots(video_id);
CREATE INDEX idx_video_snapshots_snapshot_date ON video_snapshots(snapshot_date);
CREATE INDEX idx_video_snapshots_ranking ON video_snapshots(ranking_position);

-- 2. 创建 hashtag_trends 表
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

-- 创建 hashtag_trends 表的索引
CREATE INDEX idx_hashtag_trends_hashtag_id ON hashtag_trends(hashtag_id);
CREATE INDEX idx_hashtag_trends_trend_date ON hashtag_trends(trend_date);
CREATE INDEX idx_hashtag_trends_ranking ON hashtag_trends(ranking_position);
CREATE INDEX idx_hashtag_trends_region_code ON hashtag_trends(region_code);

-- 可选：启用行级安全性 (RLS)
ALTER TABLE video_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtag_trends ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略 - 允许公开读取
CREATE POLICY "Public can read video_snapshots" ON video_snapshots FOR SELECT USING (true);
CREATE POLICY "Public can read hashtag_trends" ON hashtag_trends FOR SELECT USING (true);

-- 创建RLS策略 - 允许服务端插入和更新
CREATE POLICY "Service can insert video_snapshots" ON video_snapshots FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can update video_snapshots" ON video_snapshots FOR UPDATE USING (true);
CREATE POLICY "Service can insert hashtag_trends" ON hashtag_trends FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can update hashtag_trends" ON hashtag_trends FOR UPDATE USING (true);

-- 完成！
SELECT '时间序列表创建完成！' as status;