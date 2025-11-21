# Supabase 数据库迁移指南

本文档说明如何将现有的 Supabase 数据库升级为支持新的时间序列功能。

## 🎯 迁移目标

将现有的时间序列表更新为以下结构：

### video_snapshots 表
- ✅ 使用 UUID 主键替代 SERIAL
- ✅ 新增 `ranking_position` 字段（热门视频排名）
- ✅ 优化索引结构

### hashtag_trends 表
- ✅ 使用 UUID 主键替代 SERIAL
- ✅ 更新 `hashtag_id` 为 UUID 类型（需要同步更新 hashtags 表）
- ✅ 新增 `avg_views_per_video` 字段
- ✅ 新增 `ranking_position` 字段
- ✅ 优化索引结构

## 📋 迁移步骤

### 1. 执行数据库迁移

由于 Supabase JS SDK 不支持直接执行复杂的多行 SQL，您需要手动执行迁移脚本：

#### 方法一：使用 Supabase Dashboard（推荐）

1. 打开 [Supabase Dashboard](https://app.supabase.com/project/isorrcmivuomzolnaxgi/sql)
2. 进入 SQL Editor
3. 复制粘贴 `lib/migrations/complete_schema_update.sql` 的内容
4. 点击 "Run" 执行脚本

#### 方法二：使用 psql 命令行

```bash
psql -h db.isorrcmivuomzolnaxgi.supabase.co -p 5432 -U postgres -d postgres < lib/migrations/complete_schema_update.sql
```

### 2. 验证迁移结果

运行测试脚本验证迁移是否成功：

```bash
npx ts-node lib/execute-migration.ts
```

或者使用 Node.js：

```bash
npm run test-db  # 如果您已添加此脚本
```

## ⚠️ 重要警告

### 数据丢失风险
此迁移会**删除并重新创建所有表**，这意味着：

- ❌ **所有现有数据将被删除**
- ❌ **需要重新导入数据**

请在生产环境中执行前：
1. **备份数据库**
2. **在测试环境中先行测试**
3. **确认有数据恢复计划**

### 环境变量要求
确保以下环境变量已正确设置：

```env
NEXT_PUBLIC_SUPABASE_URL=https://isorrcmivuomzolnaxgi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 📊 迁移后的表结构

### video_snapshots
```sql
CREATE TABLE video_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  snapshot_date TIMESTAMP WITH TIME ZONE NOT NULL,
  ranking_position INTEGER, -- 新增：热门视频排名
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(video_id, snapshot_date)
);
```

### hashtag_trends
```sql
CREATE TABLE hashtag_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hashtag_id UUID NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
  mention_count INTEGER DEFAULT 0,
  unique_videos INTEGER DEFAULT 0,
  total_views BIGINT DEFAULT 0,
  avg_views_per_video BIGINT DEFAULT 0, -- 新增：平均观看数
  trend_date DATE NOT NULL,
  region_code TEXT DEFAULT 'US',
  ranking_position INTEGER, -- 新增：hashtag排名
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(hashtag_id, trend_date, region_code)
);
```

## 🔧 测试脚本

### 运行完整测试
```typescript
import { runFullDatabaseTest } from './lib/test-database-connection'

const result = await runFullDatabaseTest()
console.log(result)
```

### 仅测试时间序列功能
```typescript
import { testTimeSeriesFunctionality } from './lib/test-database-connection'

const result = await testTimeSeriesFunctionality()
console.log(result)
```

### 仅测试表结构
```typescript
import { testDatabaseSchema } from './lib/test-database-connection'

const result = await testDatabaseSchema()
console.log(result)
```

## 📈 新增功能

### 1. 视频排名追踪
- `video_snapshots.ranking_position`：记录视频在热门列表中的排名位置
- 支持追踪视频排名变化趋势

### 2. Hashtag 趋势分析
- `hashtag_trends.avg_views_per_video`：平均每个视频的观看数
- `hashtag_trends.ranking_position`：hashtag 在热门度排名中的位置
- 支持多地区趋势分析

### 3. 优化的索引
- 针对时间序列查询优化的复合索引
- 支持高效的排名和趋势分析

## 🐛 故障排除

### 常见问题

#### 1. 外键约束错误
确保所有相关表都已更新为使用 UUID 主键。

#### 2. 权限错误
确保使用 `SUPABASE_SERVICE_ROLE_KEY` 而不是匿名密钥。

#### 3. 表不存在
确认迁移脚本已完整执行，没有部分失败。

### 回滚计划

如果迁移失败，可以使用以下步骤回滚：

1. 从备份恢复数据库
2. 重新运行原始的 `lib/supabase.sql` 脚本
3. 恢复原始的 `lib/supabase-types.ts` 文件

## 📞 支持

如果遇到问题：

1. 检查 Supabase 日志
2. 运行测试脚本查看详细错误信息
3. 确认环境变量配置正确
4. 验证网络连接到 Supabase

---

**迁移完成后，您的时间序列数据库将支持更强大的视频和 hashtag 趋势分析功能！** 🎉