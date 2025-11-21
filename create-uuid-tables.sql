
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
