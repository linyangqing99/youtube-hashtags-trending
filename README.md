# YouTube Hashtag 分析平台

一个基于 Next.js 14 构建的现代化 YouTube hashtag 分析平台，专注于追踪和分析 YouTube 热门视频中的标签趋势，提供直观的热力图和数据洞察。

## ✨ 功能特色

### 🎯 核心功能
- **Hashtag 热度排行**: 展示最热门的 YouTube hashtag 及其使用趋势
- **7天热力图分析**: 可视化展示 hashtag 在过去7天的活动情况
- **趋势变化追踪**: 显示 hashtag 的增长率（上升/下降趋势）
- **国家/地区筛选**: 支持按国家或地区筛选 hashtag 数据
- **时间范围选择**: 支持不同时间范围的数据分析（付费功能）

### 📊 数据分析
- **Top Trending Hashtags**: 展示当前最热门的 hashtag 排行榜
- **活动热力图**: 通过颜色强度直观显示 hashtag 每日活动情况
- **7天得分统计**: 综合计算 hashtag 的7天热度得分
- **使用量统计**: 精确统计每个 hashtag 的提及次数
- **增长率计算**: 对比历史数据计算增长率

### 🎨 用户体验
- **响应式设计**: 完美适配桌面、平板和手机设备
- **暗色模式**: 支持亮色/暗色主题切换
- **热力图交互**: 悬停显示详细的 hashtag 活动数据
- **实时趋势**: 显示 hashtag 的增长/下降趋势图标

### 💎 商业化功能
- **免费版**: 7天历史数据，基础国家（美国）数据
- **付费版**: 更多国家数据，更长时间范围，高级筛选功能
- **API 访问**: 提供 hashtag 数据 API 接口（企业版）

## 🚀 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **UI组件**: Radix UI + Shadcn/ui
- **动画**: Framer Motion
- **图标**: Lucide React
- **数据处理**: Lodash-es
- **虚拟化**: React Window
- **图表**: Recharts

## 📦 安装和运行

### 环境要求
- Node.js 18.0 或更高版本
- npm 或 yarn 包管理器

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd youtube-hashtags-nextjs
```

2. **安装依赖**
```bash
npm install
```

3. **启动开发服务器**
```bash
npm run dev
```

4. **访问应用**
打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 生产部署

1. **构建项目**
```bash
npm run build
```

2. **启动生产服务器**
```bash
npm start
```

## 📁 项目结构

```
youtube-hashtags-nextjs/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # 主页面 - hashtag 仪表板
│   │   ├── layout.tsx         # 全局布局
│   │   └── globals.css        # 全局样式
│   ├── components/            # React组件
│   │   ├── HashtagCard.tsx    # hashtag 卡片组件
│   │   ├── HeatmapTable.tsx   # 热力图表格组件
│   │   ├── FilterBar.tsx      # 筛选栏组件
│   │   ├── TrendingBadge.tsx  # 趋势徽章组件
│   │   └── TopHashtags.tsx    # 热门 hashtag 展示组件
│   ├── lib/                   # 工具函数
│   │   ├── data.ts           # 数据处理逻辑
│   │   ├── hashtag.ts        # hashtag 分析算法
│   │   └── utils.ts          # 通用工具函数
│   ├── types/                 # TypeScript类型
│   │   └── hashtag.ts        # hashtag 数据类型定义
│   └── data/                  # 数据文件
│       ├── hashtags.json     # hashtag 统计数据
│       └── trending.json     # 热门趋势数据
├── public/                   # 静态资源
├── package.json             # 项目配置
├── tsconfig.json           # TypeScript配置
├── tailwind.config.ts      # Tailwind配置
└── README.md               # 项目说明
```

## 🎯 使用指南

### Dashboard 功能
- **Top Trending Hashtags**: 显示当前最热门的 3 个 hashtag
- **Hashtag 热力图**: 展示 hashtag 在过去 7 天的活动情况
- **趋势指标**: 显示每个 hashtag 的增长率和变化趋势

### 筛选功能
- **国家/地区**: 选择要分析的国家或地区（免费版仅支持美国）
- **时间范围**: 选择数据的时间范围（7天/30天/90天）
- **排序方式**: 按 7天提及次数、增长率或新兴 hashtag 排序

### 热力图说明
- **颜色强度**: 表示 hashtag 的活动频繁程度
  - 🔵 Low: 活动较少
  - 🟡 Medium: 中等活动
  - 🟠 Hot: 活动频繁
  - 🔴 Very Hot: 活动非常频繁
- **悬停交互**: 悬停在每个色块上查看详细数据

### 商业功能
- **免费用户**: 仅可查看美国地区 7 天数据
- **付费用户**: 可访问更多国家和更长时间范围的数据
- **企业用户**: 提供 API 访问和高级分析功能

### 主题切换
- 点击主题按钮在亮色和暗色模式间切换
- 主题设置会保存到本地存储
- 支持系统主题自动检测

## 🔧 开发指南

### 数据格式

Hashtag 分析数据格式：

```typescript
interface HashtagData {
  tag: string;               // hashtag 名称 (如 "#gaming")
  mentions: number;          // 7天总提及次数
  growth: number;           // 增长率百分比
  dailyData: DailyData[];   // 每日活动数据
  score: number;            // 7天热度得分
  videos: VideoCount[];     // 相关视频统计
}

interface DailyData {
  date: string;             // 日期 (YYYY-MM-DD)
  mentions: number;         // 当日提及次数
  changePercent: number;    // 对比上周同期变化
  activityLevel: 'low' | 'medium' | 'hot' | 'very-hot';
}

interface VideoCount {
  date: string;
  videoCount: number;       // 使用该hashtag的视频数量
  totalViews: number;       // 相关视频总观看量
}
```

### 核心组件说明

- **HashtagCard.tsx**: 显示单个 hashtag 的热门状态和趋势
- **HeatmapTable.tsx**: 7天活动热力图表格组件
- **FilterBar.tsx**: 国家、时间范围和排序筛选器
- **TrendingBadge.tsx**: 显示增长/下降趋势的徽章组件
- **TopHashtags.tsx**: 前3名热门 hashtag 展示组件

### 数据处理流程

```javascript
// 原始数据 -> hashtag 提取 -> 统计分析 -> 热力图数据
YouTube Videos → Extract Tags → Calculate Metrics → Generate Heatmap
```

### 热度计算算法

```javascript
score = (mentions * 0.4) + (growth * 0.3) + (recency * 0.2) + (consistency * 0.1)
```

### 性能优化

- 使用 React.memo 避免不必要的热力图重渲染
- 利用 useMemo 缓存 hashtag 排序和筛选结果
- 实现虚拟滚动处理大量 hashtag 数据
- 使用 Web Workers 处理复杂的数据计算

## 🌟 特色亮点

### 🎨 现代化设计
- 基于 Tailwind CSS 的精美界面
- 专业的热力图可视化设计
- 流畅的动画和悬停交互
- 完美适配所有设备的响应式布局

### ⚡ 高性能
- Next.js 14 App Router 提供最佳性能
- 服务端渲染提升首屏加载速度
- 智能缓存和数据处理优化
- 实时数据更新和趋势计算

### 🔥 智能分析
- 先进的 hashtag 热度计算算法
- 实时增长趋势分析
- 7天滚动数据统计
- 多维度数据洞察

### 📊 数据可视化
- 直观的热力图展示
- 交互式数据探索
- 实时趋势指标显示
- 多种排序和筛选选项

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 提交 Issue
- 详细描述问题或建议
- 提供复现步骤（如果是 bug）
- 包含相关的错误信息和截图

### 提交 PR
- Fork 项目并创建新分支
- 遵循项目的代码规范
- 添加必要的测试和文档
- 确保所有测试通过

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Framer Motion](https://www.framer.com/motion/) - 动画库
- [Lucide](https://lucide.dev/) - 图标库
- [YouTube Data API](https://developers.google.com/youtube/v3) - 数据来源

---

**YouTube 热门视频分析平台** - 让数据分析更简单，让趋势洞察更直观 🚀