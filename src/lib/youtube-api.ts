/**
 * YouTube API 客户端
 * 提供基础的 YouTube Data API v3 集成功能
 */

// YouTube API 配置
const YOUTUBE_API_CONFIG = {
  apiKey: process.env.YOUTUBE_API_KEY,
  baseUrl: 'https://www.googleapis.com/youtube/v3',
};

// 不在模块初始化时抛错，缺 key 时由调用方处理或返回友好错误

// YouTube 视频接口类型定义
export interface YouTubeVideo {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
      standard?: { url: string; width: number; height: number };
      maxres?: { url: string; width: number; height: number };
    };
    channelTitle: string;
    tags?: string[];
    categoryId: string;
    liveBroadcastContent: string;
    defaultLanguage?: string;
    localized: {
      title: string;
      description: string;
    };
    defaultAudioLanguage?: string;
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    favoriteCount: string;
    commentCount: string;
  };
}

export interface YouTubeApiResponse {
  kind: string;
  etag: string;
  items: YouTubeVideo[];
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

/**
 * YouTube API 客户端类
 */
export class YouTubeApiClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || YOUTUBE_API_CONFIG.apiKey;
    this.baseUrl = YOUTUBE_API_CONFIG.baseUrl;
  }

  /**
   * 获取热门视频列表
   * @param regionCode 国家代码，默认 'US'
   * @param maxResults 每页结果数，最大 50
   * @param pageToken 翻页令牌
   */
  async getPopularVideos(
    regionCode: string = 'US',
    maxResults: number = 50,
    pageToken?: string
  ): Promise<YouTubeApiResponse> {
    if (!this.apiKey) {
      throw new Error('缺少 YouTube API Key，无法请求数据');
    }
    try {
      const params = new URLSearchParams({
        part: 'snippet,statistics',
        chart: 'mostPopular',
        regionCode,
        maxResults: maxResults.toString(),
        key: this.apiKey,
        ...(pageToken && { pageToken }),
      });

      const response = await fetch(`${this.baseUrl}/videos?${params}`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching YouTube videos:', error);
      throw error;
    }
  }

  /**
   * 获取多页热门视频数据
   * @param maxPages 最大页数
   * @param regionCode 国家代码
   */
  async getAllPopularVideos(
    maxPages: number = 4,
    regionCode: string = 'US'
  ): Promise<YouTubeVideo[]> {
    if (!this.apiKey) {
      throw new Error('缺少 YouTube API Key，无法请求数据');
    }
    const allVideos: YouTubeVideo[] = [];
    let pageToken: string | undefined;
    let pageCount = 0;

    try {
      while (pageCount < maxPages) {
        const response = await this.getPopularVideos(regionCode, 50, pageToken);
        allVideos.push(...response.items);

        // 如果没有下一页，停止获取
        if (!response.nextPageToken) {
          break;
        }

        pageToken = response.nextPageToken;
        pageCount++;

        // 添加延迟避免 API 限制
        if (pageCount < maxPages && response.nextPageToken) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`获取了 ${allVideos.length} 个视频，共 ${pageCount} 页`);
      return allVideos;
    } catch (error) {
      console.error('Error in getAllPopularVideos:', error);
      throw error;
    }
  }

  /**
   * 测试 API 连接
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.getPopularVideos('US', 1);
      return response.items.length > 0;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
}

// 默认客户端实例
export const youtubeClient = new YouTubeApiClient();
