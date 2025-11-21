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
SELECT 'hashtag_trends_hourly 表创建成功!' as status;
SELECT COUNT(*) as hashtag_trends_hourly_count FROM hashtag_trends_hourly;

-- ========================================
-- 完成！现在可以运行时间序列数据创建脚本
-- ========================================
