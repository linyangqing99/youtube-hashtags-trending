export interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface YouTubeThumbnails {
  default: YouTubeThumbnail;
  medium: YouTubeThumbnail;
  high: YouTubeThumbnail;
  standard?: YouTubeThumbnail;
  maxres?: YouTubeThumbnail;
}

export interface YouTubeSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: YouTubeThumbnails;
  channelTitle: string;
  tags?: string[];
  categoryId?: string;
  liveBroadcastContent?: string;
  defaultLanguage?: string;
  localized?: {
    title: string;
    description: string;
  };
  defaultAudioLanguage?: string;
}

export interface YouTubeStatistics {
  viewCount: string;
  likeCount: string;
  favoriteCount: string;
  commentCount: string;
}

export interface YouTubeVideo {
  kind: string;
  etag: string;
  id: string;
  snippet: YouTubeSnippet;
  statistics: YouTubeStatistics;
}

export interface YouTubeVideoListResponse {
  kind: string;
  etag: string;
  items: YouTubeVideo[];
}

export interface YouTubeCategory {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    title: string;
    assignable: boolean;
    channelId: string;
  };
}

export interface YouTubeCategoryListResponse {
  kind: string;
  etag: string;
  items: YouTubeCategory[];
}

export interface VideoWithCategory extends YouTubeVideo {
  categoryName?: string;
}