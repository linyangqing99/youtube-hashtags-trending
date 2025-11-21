-- YouTube Hashtags Database Schema for Supabase
-- 基于真实YouTube API数据结构设计

-- 创建频道表
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

-- 创建视频表
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

-- 创建hashtag表
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

-- 创建视频hashtag关联表
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

-- 创建视频历史记录表（时间序列核心）
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

-- 创建hashtag热度历史表
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

-- 创建API查询记录表
CREATE TABLE api_queries (
  id SERIAL PRIMARY KEY,
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

-- 创建用户订阅表（付费功能）
CREATE TABLE user_subscriptions (
  id SERIAL PRIMARY KEY,
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

-- 创建索引以提高查询性能

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
CREATE INDEX idx_video_snapshots_video_snapshot ON video_snapshots(video_id, snapshot_date DESC);
CREATE INDEX idx_video_snapshots_snapshot_date ON video_snapshots(snapshot_date DESC);

-- 趋势分析索引
CREATE INDEX idx_hashtag_trends_hashtag_date ON hashtag_trends(hashtag_id, trend_date DESC);
CREATE INDEX idx_hashtag_trends_date_hashtag ON hashtag_trends(trend_date DESC, mention_count DESC);
CREATE INDEX idx_hashtag_trends_region_date ON hashtag_trends(region_code, trend_date DESC);

-- API查询记录索引
CREATE INDEX idx_api_queries_date ON api_queries(query_date DESC);
CREATE INDEX idx_api_queries_success ON api_queries(success, query_date DESC);

-- 启用行级安全性 (RLS)
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtag_trends ENABLE ROW LEVEL SECURITY;

-- 创建基本RLS策略
CREATE POLICY "Public can read videos" ON videos FOR SELECT USING (true);
CREATE POLICY "Public can read hashtags" ON hashtags FOR SELECT USING (true);
CREATE POLICY "Public can read video_hashtags" ON video_hashtags FOR SELECT USING (true);
CREATE POLICY "Public can read video_snapshots" ON video_snapshots FOR SELECT USING (true);
CREATE POLICY "Public can read hashtag_trends" ON hashtag_trends FOR SELECT USING (true);

-- 创建触发器来自动更新 updated_at 字段
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

-- 创建更新hashtag统计信息的函数
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