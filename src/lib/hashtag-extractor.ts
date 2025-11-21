/**
 * Hashtag 提取和分析工具
 * 从 YouTube 视频数据中提取 hashtag 并进行统计分析
 */

import { YouTubeVideo } from './youtube-api';

// Hashtag 数据接口定义
export interface HashtagData {
  tag: string;           // hashtag 名称 (如 "gaming")
  mentions: number;      // 总提及次数
  videos: YouTubeVideo[]; // 相关视频列表
  dailyCount: Map<string, number>; // 每日计数
}

export interface HashtagAnalysisResult {
  hashtags: HashtagData[];
  totalVideos: number;
  totalHashtags: number;
  topHashtags: HashtagData[];
  generatedAt: string;
}

/**
 * Hashtag 提取器类
 */
export class HashtagExtractor {
  // 无效 hashtag 名单（这些需要被过滤掉）
  private readonly invalidHashtags = new Set([
    'youtube', 'video', 'new', 'latest', 'official', 'music', 'song',
    'live', 'stream', 'gaming', 'gamer', 'games', 'gameplay',
    'shorts', 'short', 'viral', 'trending', 'subscribe', 'like',
    'comment', 'share', 'follow', 'social', 'media', 'content',
    'creator', 'channel', 'episode', 'season', 'series', 'show',
    'hd', '4k', '2025', '2024', '2023', 'first', 'part', 'episode',
  ]);

  /**
   * 从 YouTube 视频数据中提取所有 hashtag
   */
  extractHashtagsFromVideos(videos: YouTubeVideo[]): HashtagAnalysisResult {
    const hashtagMap = new Map<string, HashtagData>();

    videos.forEach(video => {
      // 1. 从 tags 字段提取
      if (video.snippet.tags) {
        video.snippet.tags.forEach(tag => {
          this.processTag(tag, video, hashtagMap);
        });
      }

      // 2. 从标题中提取 hashtag
      this.extractHashtagsFromText(video.snippet.title, video, hashtagMap);

      // 3. 从描述中提取 hashtag
      this.extractHashtagsFromText(video.snippet.description, video, hashtagMap);
    });

    // 转换为数组并排序
    const hashtags = Array.from(hashtagMap.values());
    const sortedHashtags = hashtags.sort((a, b) => b.mentions - a.mentions);
    const topHashtags = sortedHashtags.slice(0, 10);

    return {
      hashtags: sortedHashtags,
      totalVideos: videos.length,
      totalHashtags: hashtags.length,
      topHashtags,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * 处理单个 tag
   */
  private processTag(tag: string, video: YouTubeVideo, hashtagMap: Map<string, HashtagData>) {
    // 清理和标准化 tag
    const cleanTag = this.cleanHashtag(tag);

    if (!cleanTag || this.isInvalidHashtag(cleanTag)) {
      return;
    }

    // 更新 hashtag 统计
    if (!hashtagMap.has(cleanTag)) {
      hashtagMap.set(cleanTag, {
        tag: cleanTag,
        mentions: 0,
        videos: [],
        dailyCount: new Map(),
      });
    }

    const hashtagData = hashtagMap.get(cleanTag)!;
    hashtagData.mentions++;
    hashtagData.videos.push(video);

    // 更新每日计数
    const date = new Date(video.snippet.publishedAt).toISOString().split('T')[0];
    const currentCount = hashtagData.dailyCount.get(date) || 0;
    hashtagData.dailyCount.set(date, currentCount + 1);
  }

  /**
   * 从文本中提取 hashtag
   */
  private extractHashtagsFromText(text: string, video: YouTubeVideo, hashtagMap: Map<string, HashtagData>) {
    if (!text) return;

    // 匹配 # 后面跟着字母、数字、下划线的模式
    const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
    const matches = text.match(hashtagRegex);

    if (matches) {
      matches.forEach(match => {
        const cleanTag = this.cleanHashtag(match);
        if (cleanTag && !this.isInvalidHashtag(cleanTag)) {
          this.processTag(cleanTag, video, hashtagMap);
        }
      });
    }
  }

  /**
   * 清理 hashtag 文本
   */
  private cleanHashtag(tag: string): string {
    if (!tag) return '';

    return tag
      .toLowerCase()
      .replace(/^#/, '') // 移除开头的 #
      .replace(/[^a-zA-Z0-9_]/g, '') // 只保留字母、数字、下划线
      .trim()
      .replace(/_+/g, ' ') // 下划线替换为空格
      .replace(/\s+/g, ' ') // 多个空格合并为一个
      .trim();
  }

  /**
   * 检查是否为无效 hashtag
   */
  private isInvalidHashtag(tag: string): boolean {
    if (!tag || tag.length < 2) return true;
    if (tag.length > 30) return true; // 过长的 hashtag
    if (/^\d+$/.test(tag)) return true; // 纯数字
    if (this.invalidHashtags.has(tag.toLowerCase())) return true;

    return false;
  }

  /**
   * 生成热力图数据（7天活动数据）
   */
  generateHeatmapData(hashtags: HashtagData[], days: number = 7) {
    const heatmapData = new Map<string, Map<string, number>>();

    // 初始化日期范围
    const dates: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }

    hashtags.forEach(hashtag => {
      const dateMap = new Map<string, number>();

      dates.forEach(date => {
        const count = hashtag.dailyCount.get(date) || 0;
        dateMap.set(date, count);
      });

      heatmapData.set(hashtag.tag, dateMap);
    });

    return heatmapData;
  }

  /**
   * 计算 hashtag 热度得分
   */
  calculateHashtagScores(hashtags: HashtagData[]): HashtagData[] {
    const maxMentions = Math.max(...hashtags.map(h => h.mentions));
    const maxVideos = Math.max(...hashtags.map(h => h.videos.length));

    return hashtags.map(hashtag => {
      // 简化的热度计算：基于提及次数和相关视频数
      const mentionsScore = hashtag.mentions / maxMentions;
      const videosScore = hashtag.videos.length / maxVideos;
      const diversityScore = new Set(hashtag.videos.map(v => v.snippet.channelTitle)).size / hashtag.videos.length;

      const score = (mentionsScore * 0.5) + (videosScore * 0.3) + (diversityScore * 0.2);

      return {
        ...hashtag,
        mentions: hashtag.mentions, // 保持原有数据，score 可以单独添加
        // score: Math.round(score * 100), // 如果需要得分字段可以取消注释
      };
    }).sort((a, b) => b.mentions - a.mentions);
  }
}

/**
 * 示例数据处理函数 - 使用您提供的示例数据
 */
export function processSampleData(): HashtagAnalysisResult {
  const extractor = new HashtagExtractor();

  // 这里可以使用您提供的示例数据进行测试
  const sampleVideos: YouTubeVideo[] = [
    // 从您的示例数据中提取几个有 tags 的视频
    {
      kind: "youtube#video",
      etag: "00XfkOHzdjA8uhDWrW9Rl3KdHrI",
      id: "ZiyE33pWdU4",
      snippet: {
        publishedAt: "2025-11-11T23:32:15Z",
        channelId: "UCkFbAywlXz4W0BCle2eFyUw",
        title: "Toy Story 5 Teaser, Mario Galaxy Movie Leak, New DCU Show & MORE!!",
        description: "Today On Side Flick We Discuss\n\nTopics\n0:00 Intro\n0:40 Mario Galaxy Movie Leak\n3:18 V For Vendetta Show Announced\n4:36 Jimmy Olsen DCU TV Show Announced \n7:23 Toy Story 5 Teaser Trailer\n\n\n\n------------------------SOCIAL MEDIA ------------------------\n\nTik Tok: https://www.tiktok.com/@3cfilms?lang=en\nTwitter: https://twitter.com/3CFilmss\nTwitch: https://www.twitch.tv/3c_films\nInstagram: https://www.instagram.com/3cfilm/\n\nBusiness Inquiries:\n3cfilmreview@gmail.com\n\nThank You For Any Support!",
        thumbnails: {
          default: { url: "", width: 120, height: 90 },
          medium: { url: "", width: 320, height: 180 },
          high: { url: "", width: 480, height: 360 },
        },
        channelTitle: "3C Films",
        categoryId: "24",
        liveBroadcastContent: "none",
        defaultLanguage: "en",
        localized: {
          title: "Toy Story 5 Teaser, Mario Galaxy Movie Leak, New DCU Show & MORE!!",
          description: "Today On Side Flick We Discuss\n\nTopics\n0:00 Intro\n0:40 Mario Galaxy Movie Leak\n3:18 V For Vendetta Show Announced\n4:36 Jimmy Olsen DCU TV Show Announced \n7:23 Toy Story 5 Teaser Trailer\n\n\n\n------------------------SOCIAL MEDIA ------------------------\n\nTik Tok: https://www.tiktok.com/@3cfilms?lang=en\nTwitter: https://twitter.com/3CFilmss\nTwitch: https://www.twitch.tv/3c_films\nInstagram: https://www.instagram.com/3cfilm/\n\nBusiness Inquiries:\n3cfilmreview@gmail.com\n\nThank You For Any Support!"
        },
        defaultAudioLanguage: "en"
      },
      statistics: {
        viewCount: "66487",
        likeCount: "4461",
        favoriteCount: "0",
        commentCount: "505"
      }
    }
  ];

  return extractor.extractHashtagsFromVideos(sampleVideos);
}

// 默认导出
export const hashtagExtractor = new HashtagExtractor();
