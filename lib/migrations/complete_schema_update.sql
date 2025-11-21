-- 完整的数据库模式更新脚本
-- 将 hashtags 表也更新为使用 UUID 主键
-- 执行时间：2025-11-21

-- 注意：此操作会删除现有数据，请在生产环境中先备份数据！

-- 1. 删除所有相关的表（按外键依赖顺序）
DROP TABLE IF EXISTS api_queries CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS video_hashtags CASCADE;
DROP TABLE IF EXISTS video_snapshots CASCADE;
DROP TABLE IF EXISTS hashtag_trends CASCADE;
DROP TABLE IF EXISTS videos CASCADE;
DROP TABLE IF EXISTS hashtags CASCADE;
DROP TABLE IF EXISTS channels CASCADE;

-- 2. 重新创建基础表

-- 频道表
CREATE TABLE channels (
  id VARCHAR(30) PRIMARY KEY, -- YouTube channel ID
  title VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url VARCHAR(500),
  subscriber_count BIGINT,
  video_count INTEGER,
  view_count BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_video_date TIMESTAMP WITH TIME ZONE,
  category_distribution JSONB
);

-- 视频表
CREATE TABLE videos (
  id VARCHAR(20) PRIMARY KEY, -- YouTube video ID
  channel_id VARCHAR(30) NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_seconds INTEGER,
  thumbnails JSONB NOT NULL, -- 存储各种尺寸的缩略图
  category_id INTEGER,
  region_code VARCHAR(2) DEFAULT 'US',

  -- 基础统计信息
  view_count BIGINT NOT NULL DEFAULT 0,
  like_count BIGINT NOT NULL DEFAULT 0,
  comment_count BIGINT NOT NULL DEFAULT 0,

  -- 元数据
  tags TEXT[], -- YouTube原生tags
  language VARCHAR(10),
  is_live BOOLEAN DEFAULT FALSE,

  -- 系统字段
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_source VARCHAR(20) DEFAULT 'trending'
);

-- 更新的 hashtags 表（使用 UUID）
CREATE TABLE hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL, -- 标准化后的hashtag名称
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 缓存常用统计
  total_mentions INTEGER DEFAULT 0,
  total_videos INTEGER DEFAULT 0,
  total_views BIGINT DEFAULT 0,

  -- 质量评分 (0-100)
  quality_score INTEGER DEFAULT 0,

  -- 黑名单标记
  is_blocked BOOLEAN DEFAULT FALSE,
  block_reason VARCHAR(100),

  -- 更新时间
  last_mention_date TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 视频hashtag关联表
CREATE TABLE video_hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id VARCHAR(20) NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  hashtag_id UUID NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,

  -- 来源信息
  source VARCHAR(20) NOT NULL CHECK (source IN ('title', 'description', 'tags', 'extracted')),
  position INTEGER, -- 在内容中的位置
  confidence_score FLOAT DEFAULT 1.0 CHECK (confidence_score >= 0 AND confidence_score <= 1),

  -- 创建时间
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 确保唯一性
  UNIQUE(video_id, hashtag_id, source)
);

-- 新的视频快照表（时间序列核心）
CREATE TABLE video_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id VARCHAR(20) NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  snapshot_date TIMESTAMP WITH TIME ZONE NOT NULL,
  ranking_position INTEGER, -- 在热门视频中的排名位置
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(video_id, snapshot_date)
);

-- 新的 hashtag 趋势表
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

-- API查询记录表
CREATE TABLE api_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_type VARCHAR(20) NOT NULL CHECK (query_type IN ('trending', 'search', 'category')),
  region_code VARCHAR(2) DEFAULT 'US',
  page_number INTEGER NOT NULL,
  total_results INTEGER NOT NULL,
  query_date TIMESTAMP WITH TIME ZONE NOT NULL,

  -- 性能指标
  response_time_ms INTEGER,
  success BOOLEAN NOT NULL,
  error_message TEXT,

  -- 系统信息
  api_version VARCHAR(10) DEFAULT 'v3',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户订阅表
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  subscription_type VARCHAR(20) NOT NULL CHECK (subscription_type IN ('free', 'premium', 'enterprise')),
  stripe_customer_id VARCHAR(100),

  -- 功能权限
  max_hashtags INTEGER DEFAULT 50, -- 免费版限制
  max_days_history INTEGER DEFAULT 7, -- 免费版只看7天
  real_time_updates BOOLEAN DEFAULT FALSE,

  -- 订阅状态
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  trial_end_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,

  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建所有索引以提高查询性能

-- 视频表索引
CREATE INDEX idx_videos_published_at ON videos(published_at DESC);
CREATE INDEX idx_videos_channel_id ON videos(channel_id);
CREATE INDEX idx_videos_region_code ON videos(region_code);
CREATE INDEX idx_videos_category_id ON videos(category_id);
CREATE INDEX idx_videos_view_count ON videos(view_count DESC);
CREATE INDEX idx_videos_trending_composite ON videos(region_code, published_at DESC, view_count DESC);

-- Hashtag表索引
CREATE INDEX idx_hashtags_name ON hashtags(name);
CREATE INDEX idx_hashtags_total_mentions ON hashtags(total_mentions DESC);
CREATE INDEX idx_hashtags_quality_score ON hashtags(quality_score DESC);
CREATE INDEX idx_hashtags_created_at ON hashtags(created_at DESC);
CREATE INDEX idx_hashtags_is_blocked ON hashtags(is_blocked);

-- 关联表索引
CREATE INDEX idx_video_hashtags_video_id ON video_hashtags(video_id);
CREATE INDEX idx_video_hashtags_hashtag_id ON video_hashtags(hashtag_id);
CREATE INDEX idx_video_hashtags_created_at ON video_hashtags(created_at DESC);

-- 时间序列索引（关键）
CREATE INDEX idx_video_snapshots_video_id ON video_snapshots(video_id);
CREATE INDEX idx_video_snapshots_snapshot_date ON video_snapshots(snapshot_date);
CREATE INDEX idx_video_snapshots_ranking ON video_snapshots(ranking_position);
CREATE INDEX idx_video_snapshots_video_snapshot_date ON video_snapshots(video_id, snapshot_date DESC);

-- 趋势分析索引
CREATE INDEX idx_hashtag_trends_hashtag_id ON hashtag_trends(hashtag_id);
CREATE INDEX idx_hashtag_trends_trend_date ON hashtag_trends(trend_date);
CREATE INDEX idx_hashtag_trends_ranking ON hashtag_trends(ranking_position);
CREATE INDEX idx_hashtag_trends_region_code ON hashtag_trends(region_code);
CREATE INDEX idx_hashtag_trends_hashtag_date ON hashtag_trends(hashtag_id, trend_date DESC);
CREATE INDEX idx_hashtag_trends_date_ranking ON hashtag_trends(trend_date DESC, ranking_position);

-- API查询记录索引
CREATE INDEX idx_api_queries_date ON api_queries(query_date DESC);
CREATE INDEX idx_api_queries_success ON api_queries(success, query_date DESC);

-- 4. 启用行级安全性 (RLS)
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtag_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 5. 创建基本RLS策略
CREATE POLICY "Public can read channels" ON channels FOR SELECT USING (true);
CREATE POLICY "Public can read videos" ON videos FOR SELECT USING (true);
CREATE POLICY "Public can read hashtags" ON hashtags FOR SELECT USING (true);
CREATE POLICY "Public can read video_hashtags" ON video_hashtags FOR SELECT USING (true);
CREATE POLICY "Public can read video_snapshots" ON video_snapshots FOR SELECT USING (true);
CREATE POLICY "Public can read hashtag_trends" ON hashtag_trends FOR SELECT USING (true);

-- 服务端插入策略
CREATE POLICY "Service can insert channels" ON channels FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can insert videos" ON videos FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can insert hashtags" ON hashtags FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can insert video_hashtags" ON video_hashtags FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can insert video_snapshots" ON video_snapshots FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can insert hashtag_trends" ON hashtag_trends FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can insert api_queries" ON api_queries FOR INSERT WITH CHECK (true);

-- 服务端更新策略
CREATE POLICY "Service can update channels" ON channels FOR UPDATE USING (true);
CREATE POLICY "Service can update videos" ON videos FOR UPDATE USING (true);
CREATE POLICY "Service can update hashtags" ON hashtags FOR UPDATE USING (true);
CREATE POLICY "Service can update video_hashtags" ON video_hashtags FOR UPDATE USING (true);
CREATE POLICY "Service can update video_snapshots" ON video_snapshots FOR UPDATE USING (true);
CREATE POLICY "Service can update hashtag_trends" ON hashtag_trends FOR UPDATE USING (true);

-- 6. 创建触发器来自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hashtags_updated_at BEFORE UPDATE ON hashtags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. 创建更新hashtag统计信息的函数
CREATE OR REPLACE FUNCTION update_hashtag_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- 更新hashtag的统计信息
    UPDATE hashtags
    SET
        total_mentions = total_mentions + 1,
        total_views = total_views + (
            SELECT view_count
            FROM videos
            WHERE id = NEW.video_id
        ),
        last_mention_date = NOW(),
        updated_at = NOW()
    WHERE id = NEW.hashtag_id;

    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hashtag_stats_trigger
    AFTER INSERT ON video_hashtags
    FOR EACH ROW EXECUTE FUNCTION update_hashtag_stats();

-- 8. 创建聚合视图以便于查询
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

-- 完成！所有表结构已更新为使用UUID主键并包含了新的时间序列功能