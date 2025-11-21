# 🎯 简化版数据库设置指南

## 📝 只需要创建3个表！

我为你简化了数据库结构，只需要3个表就能运行所有核心功能：

### 🔗 你的Supabase项目链接
**访问地址**: https://isorrcmivuomzolnaxgi.supabase.co

---

## 🛠️ 创建步骤

### 第1步：打开SQL编辑器

1. 访问你的Supabase项目: https://isorrcmivuomzolnaxgi.supabase.co
2. 左侧菜单点击 **"SQL Editor"**
3. 点击 **"New query"** 按钮
4. 复制下面的代码，粘贴到编辑器中
5. 点击 **"Run"** 执行

### 第2步：复制并执行这个SQL

```sql
-- YouTube视频表
CREATE TABLE videos (
  id VARCHAR(20) PRIMARY KEY, -- YouTube视频ID
  title VARCHAR(500) NOT NULL, -- 视频标题
  description TEXT, -- 视频描述
  channel_title VARCHAR(255) NOT NULL, -- 频道名称
  view_count BIGINT DEFAULT 0, -- 观看次数
  like_count BIGINT DEFAULT 0, -- 点赞次数
  comment_count BIGINT DEFAULT 0, -- 评论次数
  published_at TIMESTAMP WITH TIME ZONE, -- 发布时间
  tags TEXT[], -- YouTube原始标签
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hashtag表
CREATE TABLE hashtags (
  id SERIAL PRIMARY KEY, -- 自增ID
  name VARCHAR(100) UNIQUE NOT NULL, -- hashtag名称(不含#号)
  count INTEGER DEFAULT 0, -- 使用次数
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 视频和Hashtag关联表
CREATE TABLE video_hashtags (
  id SERIAL PRIMARY KEY,
  video_id VARCHAR(20) REFERENCES videos(id) ON DELETE CASCADE,
  hashtag_id INTEGER REFERENCES hashtags(id) ON DELETE CASCADE,
  source VARCHAR(20) DEFAULT 'extracted', -- 来源: title, description, tags
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(video_id, hashtag_id)
);

-- 创建索引提高查询速度
CREATE INDEX idx_hashtags_count ON hashtags(count DESC);
CREATE INDEX idx_hashtags_name ON hashtags(name);
CREATE INDEX idx_videos_published_at ON videos(published_at DESC);
CREATE INDEX idx_videos_view_count ON videos(view_count DESC);
```

---

## ✅ 执行完成后

### 第3步：验证表创建成功

在SQL编辑器中运行这个查询：

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('videos', 'hashtags', 'video_hashtags');
```

你应该看到3个表的名字。

### 第4步：测试连接

访问: http://localhost:3002/supabase-test
点击"测试连接"按钮，应该显示成功！

---

## 📊 表结构说明

### 1. `videos` 表
- 存储YouTube视频的基本信息
- 包括标题、描述、观看数、点赞数等
- 主键是YouTube视频ID

### 2. `hashtags` 表
- 存储所有提取的hashtag
- 记录每个hashtag的使用次数
- 自动去重

### 3. `video_hashtags` 表
- 连接视频和hashtag的关系
- 记录hashtag是从哪里提取的（标题/描述/标签）
- 防止重复关联

---

## 🎯 这样就够了！

这3个表足够支持：
- ✅ 从YouTube API获取视频数据
- ✅ 自动提取hashtag
- ✅ 统计hashtag使用频率
- ✅ 展示热门hashtag列表
- ✅ 生成hashtag热力图

---

## ❓ 如果遇到问题

1. **SQL执行失败**: 检查是否有语法错误，重新复制代码
2. **表没创建**: 确保点击了"Run"按钮
3. **连接测试失败**: 检查环境变量是否正确设置

有任何问题随时告诉我！🚀