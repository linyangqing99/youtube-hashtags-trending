// Supabase Database TypeScript Types
// Generated for YouTube Hashtags Project

export type Database = {
  public: {
    Tables: {
      channels: {
        Row: {
          id: string; // YouTube channel ID
          title: string;
          description: string | null;
          thumbnail_url: string | null;
          subscriber_count: number | null;
          video_count: number | null;
          view_count: number | null;
          created_at: string;
          updated_at: string;
          last_video_date: string | null;
          category_distribution: Record<string, any> | null;
        };
        Insert: {
          id: string;
          title: string;
          description?: string | null;
          thumbnail_url?: string | null;
          subscriber_count?: number | null;
          video_count?: number | null;
          view_count?: number | null;
          created_at?: string;
          updated_at?: string;
          last_video_date?: string | null;
          category_distribution?: Record<string, any> | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          thumbnail_url?: string | null;
          subscriber_count?: number | null;
          video_count?: number | null;
          view_count?: number | null;
          created_at?: string;
          updated_at?: string;
          last_video_date?: string | null;
          category_distribution?: Record<string, any> | null;
        };
        Relationships: [];
      };
      videos: {
        Row: {
          id: string; // YouTube video ID
          channel_id: string;
          title: string;
          description: string | null;
          published_at: string;
          duration_seconds: number | null;
          thumbnails: Record<string, any>; // 缩略图JSON
          category_id: number | null;
          region_code: string;
          view_count: number;
          like_count: number;
          comment_count: number;
          tags: string[] | null; // YouTube原生tags
          language: string | null;
          is_live: boolean;
          created_at: string;
          updated_at: string;
          data_source: string;
        };
        Insert: {
          id: string;
          channel_id: string;
          title: string;
          description?: string | null;
          published_at: string;
          duration_seconds?: number | null;
          thumbnails: Record<string, any>;
          category_id?: number | null;
          region_code?: string;
          view_count?: number;
          like_count?: number;
          comment_count?: number;
          tags?: string[] | null;
          language?: string | null;
          is_live?: boolean;
          created_at?: string;
          updated_at?: string;
          data_source?: string;
        };
        Update: {
          id?: string;
          channel_id?: string;
          title?: string;
          description?: string | null;
          published_at?: string;
          duration_seconds?: number | null;
          thumbnails?: Record<string, any>;
          category_id?: number | null;
          region_code?: string;
          view_count?: number;
          like_count?: number;
          comment_count?: number;
          tags?: string[] | null;
          language?: string | null;
          is_live?: boolean;
          created_at?: string;
          updated_at?: string;
          data_source?: string;
        };
        Relationships: [];
      };
      hashtags: {
        Row: {
          id: string; // UUID
          name: string; // 标准化hashtag名称
          created_at: string; // TIMESTAMP WITH TIME ZONE
          total_mentions: number; // 缓存的提及总数
          total_videos: number; // 缓存的相关视频数
          total_views: number; // 缓存的总观看数
          quality_score: number; // 质量评分 0-100
          is_blocked: boolean; // 黑名单标记
          block_reason: string | null;
          last_mention_date: string | null; // TIMESTAMP WITH TIME ZONE
          updated_at: string; // TIMESTAMP WITH TIME ZONE
        };
        Insert: {
          id?: string; // UUID
          name: string;
          created_at?: string; // TIMESTAMP WITH TIME ZONE
          total_mentions?: number;
          total_videos?: number;
          total_views?: number;
          quality_score?: number;
          is_blocked?: boolean;
          block_reason?: string | null;
          last_mention_date?: string | null; // TIMESTAMP WITH TIME ZONE
          updated_at?: string; // TIMESTAMP WITH TIME ZONE
        };
        Update: {
          id?: string; // UUID
          name?: string;
          created_at?: string; // TIMESTAMP WITH TIME ZONE
          total_mentions?: number;
          total_videos?: number;
          total_views?: number;
          quality_score?: number;
          is_blocked?: boolean;
          block_reason?: string | null;
          last_mention_date?: string | null; // TIMESTAMP WITH TIME ZONE
          updated_at?: string; // TIMESTAMP WITH TIME ZONE
        };
        Relationships: [];
      };
      video_hashtags: {
        Row: {
          id: string; // UUID
          video_id: string;
          hashtag_id: string; // UUID
          source: 'title' | 'description' | 'tags' | 'extracted';
          position: number | null;
          confidence_score: number; // 0-1
          created_at: string; // TIMESTAMP WITH TIME ZONE
        };
        Insert: {
          id?: string; // UUID
          video_id: string;
          hashtag_id: string; // UUID
          source: 'title' | 'description' | 'tags' | 'extracted';
          position?: number | null;
          confidence_score?: number;
          created_at?: string; // TIMESTAMP WITH TIME ZONE
        };
        Update: {
          id?: string; // UUID
          video_id?: string;
          hashtag_id?: string; // UUID
          source?: 'title' | 'description' | 'tags' | 'extracted';
          position?: number | null;
          confidence_score?: number;
          created_at?: string; // TIMESTAMP WITH TIME ZONE
        };
        Relationships: [];
      };
      video_snapshots: {
        Row: {
          id: string; // UUID
          video_id: string;
          view_count: number;
          like_count: number;
          comment_count: number;
          snapshot_date: string; // TIMESTAMP WITH TIME ZONE
          ranking_position: number | null; // 在热门视频中的排名位置
          created_at: string; // TIMESTAMP WITH TIME ZONE
        };
        Insert: {
          id?: string; // UUID
          video_id: string;
          view_count?: number;
          like_count?: number;
          comment_count?: number;
          snapshot_date: string; // TIMESTAMP WITH TIME ZONE
          ranking_position?: number | null;
          created_at?: string; // TIMESTAMP WITH TIME ZONE
        };
        Update: {
          id?: string; // UUID
          video_id?: string;
          view_count?: number;
          like_count?: number;
          comment_count?: number;
          snapshot_date?: string; // TIMESTAMP WITH TIME ZONE
          ranking_position?: number | null;
          created_at?: string; // TIMESTAMP WITH TIME ZONE
        };
        Relationships: [];
      };
      hashtag_trends: {
        Row: {
          id: string; // UUID
          hashtag_id: string; // UUID - 需要更新hashtags表以使用UUID
          mention_count: number; // 在当前热门视频中出现的总次数
          unique_videos: number; // 关联的独特视频数量
          total_views: number; // 关联视频的总观看数
          avg_views_per_video: number; // 每个视频平均观看数
          trend_date: string; // DATE format YYYY-MM-DD
          region_code: string; // 默认 'US'
          ranking_position: number | null; // 在hashtag热门度排名中的位置
          created_at: string; // TIMESTAMP WITH TIME ZONE
        };
        Insert: {
          id?: string; // UUID
          hashtag_id: string; // UUID
          mention_count?: number;
          unique_videos?: number;
          total_views?: number;
          avg_views_per_video?: number;
          trend_date: string; // DATE format YYYY-MM-DD
          region_code?: string;
          ranking_position?: number | null;
          created_at?: string; // TIMESTAMP WITH TIME ZONE
        };
        Update: {
          id?: string; // UUID
          hashtag_id?: string; // UUID
          mention_count?: number;
          unique_videos?: number;
          total_views?: number;
          avg_views_per_video?: number;
          trend_date?: string; // DATE format YYYY-MM-DD
          region_code?: string;
          ranking_position?: number | null;
          created_at?: string; // TIMESTAMP WITH TIME ZONE
        };
        Relationships: [];
      };
      api_queries: {
        Row: {
          id: string; // UUID
          query_type: 'trending' | 'search' | 'category';
          region_code: string;
          page_number: number;
          total_results: number;
          query_date: string; // TIMESTAMP WITH TIME ZONE
          response_time_ms: number | null;
          success: boolean;
          error_message: string | null;
          api_version: string;
          created_at: string; // TIMESTAMP WITH TIME ZONE
        };
        Insert: {
          id?: string; // UUID
          query_type: 'trending' | 'search' | 'category';
          region_code?: string;
          page_number: number;
          total_results: number;
          query_date: string; // TIMESTAMP WITH TIME ZONE
          response_time_ms?: number | null;
          success: boolean;
          error_message?: string | null;
          api_version?: string;
          created_at?: string; // TIMESTAMP WITH TIME ZONE
        };
        Update: {
          id?: string; // UUID
          query_type?: 'trending' | 'search' | 'category';
          region_code?: string;
          page_number?: number;
          total_results?: number;
          query_date?: string; // TIMESTAMP WITH TIME ZONE
          response_time_ms?: number | null;
          success?: boolean;
          error_message?: string | null;
          api_version?: string;
          created_at?: string; // TIMESTAMP WITH TIME ZONE
        };
        Relationships: [];
      };
      user_subscriptions: {
        Row: {
          id: string; // UUID
          email: string;
          subscription_type: 'free' | 'premium' | 'enterprise';
          stripe_customer_id: string | null;
          max_hashtags: number;
          max_days_history: number;
          real_time_updates: boolean;
          status: 'active' | 'cancelled' | 'expired';
          trial_end_date: string | null; // TIMESTAMP WITH TIME ZONE
          subscription_end_date: string | null; // TIMESTAMP WITH TIME ZONE
          created_at: string; // TIMESTAMP WITH TIME ZONE
          updated_at: string; // TIMESTAMP WITH TIME ZONE
        };
        Insert: {
          id?: string; // UUID
          email: string;
          subscription_type: 'free' | 'premium' | 'enterprise';
          stripe_customer_id?: string | null;
          max_hashtags?: number;
          max_days_history?: number;
          real_time_updates?: boolean;
          status?: 'active' | 'cancelled' | 'expired';
          trial_end_date?: string | null; // TIMESTAMP WITH TIME ZONE
          subscription_end_date?: string | null; // TIMESTAMP WITH TIME ZONE
          created_at?: string; // TIMESTAMP WITH TIME ZONE
          updated_at?: string; // TIMESTAMP WITH TIME ZONE
        };
        Update: {
          id?: string; // UUID
          email?: string;
          subscription_type?: 'free' | 'premium' | 'enterprise';
          stripe_customer_id?: string | null;
          max_hashtags?: number;
          max_days_history?: number;
          real_time_updates?: boolean;
          status?: 'active' | 'cancelled' | 'expired';
          trial_end_date?: string | null; // TIMESTAMP WITH TIME ZONE
          subscription_end_date?: string | null; // TIMESTAMP WITH TIME ZONE
          created_at?: string; // TIMESTAMP WITH TIME ZONE
          updated_at?: string; // TIMESTAMP WITH TIME ZONE
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_table_columns: {
        Args: {
          table_name: string;
        };
        Returns: {
          column_name: string;
          data_type: string;
          is_nullable: string;
          column_default: string | null;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// YouTube API响应类型定义
export interface YouTubeVideoSnippet {
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
}

export interface YouTubeVideoStatistics {
  viewCount: string;
  likeCount: string;
  favoriteCount: string;
  commentCount: string;
}

export interface YouTubeVideo {
  kind: string;
  etag: string;
  id: string;
  snippet: YouTubeVideoSnippet;
  statistics: YouTubeVideoStatistics;
}

export interface YouTubeVideoListResponse {
  kind: string;
  etag: string;
  items: YouTubeVideo[];
  nextPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

// Hashtag提取相关类型
export interface ExtractedHashtag {
  name: string;
  source: 'title' | 'description' | 'tags' | 'extracted';
  position?: number;
  confidence: number;
}

export interface HashtagExtractionResult {
  videoId: string;
  hashtags: ExtractedHashtag[];
  extractionStats: {
    totalFromTitle: number;
    totalFromDescription: number;
    totalFromTags: number;
    totalExtracted: number;
    uniqueCount: number;
  };
}

// 热力图数据类型
export interface HashtagHeatmapData {
  hashtagName: string;
  hashtagId: number;
  trendData: {
    date: string;
    mentions: number;
    views: number;
    uniqueVideos: number;
    rank: number;
  }[];
  totalMentions: number;
  totalViews: number;
  qualityScore: number;
}

// API查询参数类型
export interface APIQueryParams {
  regionCode?: string;
  maxResults?: number;
  pageToken?: string;
  saveToDb?: boolean;
}
