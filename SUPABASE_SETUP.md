# Supabase数据库集成设置指南

## 概述

本项目已集成Supabase作为数据库后端，用于存储YouTube视频数据和hashtag分析结果。Supabase提供PostgreSQL数据库、实时功能和优秀的TypeScript支持。

## 🚀 快速开始

### 1. 创建Supabase项目

1. 访问 [Supabase官网](https://supabase.com)
2. 点击 "Start your project" 并注册/登录
3. 点击 "New Project"
4. 选择组织（或创建新组织）
5. 填写项目信息：
   - **Project Name**: `youtube-hashtags-analyzer`
   - **Database Password**: 设置一个强密码
   - **Region**: 选择离你最近的区域
6. 点击 "Create new project"

### 2. 获取项目凭据

项目创建完成后：

1. 进入项目设置 (Settings → API)
2. 复制以下信息：
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public**: `eyJ...` (公开密钥)
   - **service_role**: `eyJ...` (服务端密钥)

### 3. 配置环境变量

在项目根目录的 `.env.local` 文件中配置：

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 4. 设置数据库表结构

有两种方法设置数据库：

#### 方法A：使用SQL文件（推荐）

1. 进入Supabase项目的SQL编辑器 (SQL Editor)
2. 粘贴 `lib/supabase.sql` 文件的内容
3. 点击 "Run" 执行SQL

#### 方法B：使用MCP

1. 确保已安装MCP服务器：`npx @supabase/mcp-server`
2. 配置 `.mcp-config.json` 文件
3. 运行数据库迁移

## 📊 数据库表结构

### 核心表

1. **channels** - YouTube频道信息
2. **videos** - 视频基础信息
3. **hashtags** - 标准化hashtag库
4. **video_hashtags** - 视频与hashtag关联
5. **video_snapshots** - 视频统计数据历史快照
6. **hashtag_trends** - hashtag热度趋势数据

### 辅助表

1. **api_queries** - API查询记录
2. **user_subscriptions** - 用户订阅管理

## 🧪 测试集成

### 1. 启动开发服务器

```bash
pnpm run dev
```

### 2. 访问测试页面

打开浏览器访问：`http://localhost:3000/supabase-test`

### 3. 运行测试

测试页面提供以下测试选项：

- **连接测试**: 验证数据库连接
- **Hashtag提取测试**: 测试hashtag提取算法
- **完整功能测试**: 测试所有集成功能
- **自定义数据测试**: 使用自定义视频数据测试

### 4. API端点测试

也可以直接使用API端点测试：

```bash
# 测试所有功能
curl "http://localhost:3000/api/test-supabase"

# 测试特定功能
curl "http://localhost:3000/api/test-supabase?test=connection"
curl "http://localhost:3000/api/test-supabase?test=hashtag-extraction"

# POST自定义数据测试
curl -X POST "http://localhost:3000/api/test-supabase" \
  -H "Content-Type: application/json" \
  -d '{"videoData": {...}, "testMode": "extraction-only"}'
```

## 🔧 功能特性

### Hashtag提取算法

支持多源hashtag提取：

1. **显式hashtag**: 从文本中提取 `#hashtag`
2. **原生tags**: 使用YouTube提供的tags数组
3. **智能提取**: 从标题中提取有意义的词汇

### 数据处理流程

1. **API调用**: 获取YouTube热门视频数据
2. **Hashtag提取**: 使用多源算法提取hashtag
3. **数据清洗**: 标准化和去重
4. **数据库存储**: 写入Supabase数据库
5. **快照记录**: 创建时间序列快照

### 时间序列支持

- **视频快照**: 记录视频统计数据变化
- **hashtag趋势**: 跟踪hashtag热度变化
- **7天热力图**: 支持滚动时间窗口分析

## 📋 环境变量完整列表

```env
# YouTube API Configuration
YOUTUBE_API_KEY=your_youtube_api_key

# Proxy Settings (可选)
HTTPS_PROXY=http://127.0.0.1:7890
HTTP_PROXY=http://127.0.0.1:7890
ALL_PROXY=socks5://127.0.0.1:7890

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🛠️ 开发工具

### 文件结构

```
lib/
├── supabase.ts              # Supabase客户端配置
├── supabase-types.ts        # TypeScript类型定义
├── supabase.sql             # 数据库表结构
└── hashtag-extractor.ts     # Hashtag提取算法

src/app/
├── api/test-supabase/       # Supabase测试API
└── supabase-test/           # 测试页面
```

### 主要函数

- `testSupabaseConnection()`: 测试数据库连接
- `createHashtag()`: 创建新hashtag
- `createVideoHashtagRelations()`: 创建视频hashtag关联
- `extractHashtagsFromVideo()`: 提取视频hashtag
- `upsertVideo()`: 创建/更新视频数据

## 🚨 故障排除

### 常见问题

1. **连接失败**
   - 检查环境变量是否正确配置
   - 验证Supabase项目URL和密钥
   - 确保数据库表已创建

2. **权限错误**
   - 检查RLS策略设置
   - 验证API密钥权限
   - 确保服务端使用正确的密钥

3. **Hashtag提取问题**
   - 检查YouTube API数据格式
   - 验证hashtag提取算法配置
   - 调整置信度阈值

### 调试技巧

1. **启用详细日志**:
   ```typescript
   console.log('Supabase配置检查:', {
     url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌',
     anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌',
     serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌'
   });
   ```

2. **检查数据库连接**:
   ```typescript
   const { data, error } = await supabase
     .from('hashtags')
     .select('count')
     .limit(1);
   ```

## 📚 相关资源

- [Supabase文档](https://supabase.com/docs)
- [Supabase JavaScript客户端](https://supabase.com/docs/reference/javascript)
- [YouTube Data API文档](https://developers.google.com/youtube/v3)
- [Next.js环境变量](https://nextjs.org/docs/basic-features/environment-variables)

## 🎯 下一步

集成完成后，你可以：

1. **扩展API接口**: 修改 `youtube-raw-curl` 接口支持数据入库
2. **实现轮询机制**: 设置每12小时自动查询数据
3. **开发前端组件**: 创建hashtag热力图显示组件
4. **实现付费功能**: 基于用户订阅表实现功能限制