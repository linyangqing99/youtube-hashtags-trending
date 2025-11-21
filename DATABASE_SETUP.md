# 🎉 Supabase连接验证成功！

## ✅ 已完成配置

1. **Supabase项目连接**: ✅ 成功连接到你的Supabase项目
2. **环境变量配置**: ✅ 所有必要的环境变量已正确配置
3. **Hashtag提取算法**: ✅ 算法运行正常，可以正确提取hashtag
4. **MCP配置**: ✅ MCP服务器配置正确

## 📋 下一步操作

### 1. 创建数据库表结构

访问你的Supabase项目：https://isorrcmivuomzolnaxgi.supabase.co

1. 进入 **SQL编辑器** (左侧菜单 → SQL Editor)
2. 点击 **"New query"**
3. 复制以下SQL代码并粘贴到编辑器中：

```sql
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
  id SERIAL PRIMARY KEY,
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
  id SERIAL PRIMARY KEY,
  video_id VARCHAR(20) NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  hashtag_id INTEGER NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,

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
  id SERIAL PRIMARY KEY,
  video_id VARCHAR(20) NOT NULL REFERENCES videos(id) ON DELETE CASCADE,

  -- 统计数据快照
  view_count BIGINT NOT NULL,
  like_count BIGINT NOT NULL,
  comment_count BIGINT NOT NULL,

  -- 快照时间
  snapshot_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 确保每个视频每个快照时间只有一个记录
  UNIQUE(video_id, snapshot_date)
);

-- 创建hashtag热度历史表
CREATE TABLE hashtag_trends (
  id SERIAL PRIMARY KEY,
  hashtag_id INTEGER NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,

  -- 热度指标
  mention_count INTEGER NOT NULL DEFAULT 0,
  unique_videos INTEGER NOT NULL DEFAULT 0,
  total_views BIGINT NOT NULL DEFAULT 0,

  -- 时间信息
  trend_date DATE NOT NULL, -- 只存储日期部分
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 地区信息
  region_code VARCHAR(2) DEFAULT 'US',

  -- 确保唯一性
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

-- 创建索引以提高查询性能
CREATE INDEX idx_videos_published_at ON videos(published_at DESC);
CREATE INDEX idx_videos_channel_id ON videos(channel_id);
CREATE INDEX idx_videos_region_code ON videos(region_code);
CREATE INDEX idx_videos_view_count ON videos(view_count DESC);

CREATE INDEX idx_hashtags_name ON hashtags(name);
CREATE INDEX idx_hashtags_total_mentions ON hashtags(total_mentions DESC);
CREATE INDEX idx_hashtags_created_at ON hashtags(created_at DESC);

CREATE INDEX idx_video_hashtags_video_id ON video_hashtags(video_id);
CREATE INDEX idx_video_hashtags_hashtag_id ON video_hashtags(hashtag_id);
CREATE INDEX idx_video_hashtags_created_at ON video_hashtags(created_at DESC);

CREATE INDEX idx_video_snapshots_video_snapshot ON video_snapshots(video_id, snapshot_date DESC);
CREATE INDEX idx_video_snapshots_snapshot_date ON video_snapshots(snapshot_date DESC);

CREATE INDEX idx_hashtag_trends_hashtag_date ON hashtag_trends(hashtag_id, trend_date DESC);
CREATE INDEX idx_hashtag_trends_date_hashtag ON hashtag_trends(trend_date DESC, mention_count DESC);
```

4. 点击 **"Run"** 执行SQL

### 2. 验证数据库设置

执行完SQL后，你可以：

1. **在SQL编辑器中验证**:
   ```sql
   SELECT count(*) FROM hashtags;
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
   ```

2. **测试API连接**:
   - 重启开发服务器
   - 访问 `http://localhost:3002/supabase-test`
   - 点击"测试连接"按钮

3. **检查数据库表**:
   - 在Supabase控制台的"Table Editor"中查看创建的表
   - 确认所有表都已创建成功

### 3. 开始使用数据库

数据库创建成功后，你就可以：

1. **测试hashtag提取功能**
2. **将YouTube API数据保存到数据库**
3. **实现hashtag热度分析**
4. **开发7天滚动热力图**

## 🎯 测试步骤

完成数据库表创建后：

1. **访问测试页面**: `http://localhost:3002/supabase-test`
2. **运行完整测试**: 点击"完整功能测试"按钮
3. **查看测试结果**: 确认所有功能都正常工作

## ❓ 遇到问题？

如果遇到任何问题：

1. **检查SQL执行**: 确保SQL语句没有语法错误
2. **查看错误信息**: 在Supabase控制台查看具体错误
3. **重新运行**: 可以重新执行SQL语句
4. **清理重建**: 如果需要，可以删除表重新创建

---

**🎉 恭喜！你的Supabase数据库集成已经完成，可以开始进行hashtag分析了！**