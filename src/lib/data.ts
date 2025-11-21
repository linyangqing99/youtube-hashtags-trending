import { YouTubeVideoListResponse, YouTubeVideo, VideoWithCategory } from '@/types/youtube';
import { getCategoryName } from './categories';
import videosData from '@/data/videos.json';

// 视频数据缓存
let videos: VideoWithCategory[] | null = null;

// 加载并处理视频数据
export function loadVideos(): VideoWithCategory[] {
  if (videos) return videos;

  const rawVideos = (videosData as YouTubeVideoListResponse).items;

  videos = rawVideos.map((video: YouTubeVideo) => ({
    ...video,
    categoryName: getCategoryName(video.snippet.categoryId || ''),
  }));

  return videos;
}

// 获取所有视频
export function getAllVideos(): VideoWithCategory[] {
  return loadVideos();
}

// 搜索视频
export function searchVideos(query: string): VideoWithCategory[] {
  const allVideos = getAllVideos();
  const searchTerm = query.toLowerCase().trim();

  if (!searchTerm) return allVideos;

  return allVideos.filter((video) => {
    const title = video.snippet.title.toLowerCase();
    const channel = video.snippet.channelTitle.toLowerCase();
    const description = video.snippet.description.toLowerCase();
    const tags = video.snippet.tags?.join(' ').toLowerCase() || '';

    return (
      title.includes(searchTerm) ||
      channel.includes(searchTerm) ||
      description.includes(searchTerm) ||
      tags.includes(searchTerm)
    );
  });
}

// 按类别筛选视频
export function filterVideosByCategory(categoryId: string): VideoWithCategory[] {
  const allVideos = getAllVideos();

  if (!categoryId) return allVideos;

  return allVideos.filter((video) =>
    video.snippet.categoryId === categoryId
  );
}

// 复合筛选（搜索 + 类别）
export function filterVideos(query: string, categoryId: string): VideoWithCategory[] {
  let filteredVideos = getAllVideos();

  // 先按类别筛选
  if (categoryId) {
    filteredVideos = filteredVideos.filter((video) =>
      video.snippet.categoryId === categoryId
    );
  }

  // 再按搜索词筛选
  if (query.trim()) {
    const searchTerm = query.toLowerCase().trim();
    filteredVideos = filteredVideos.filter((video) => {
      const title = video.snippet.title.toLowerCase();
      const channel = video.snippet.channelTitle.toLowerCase();
      const description = video.snippet.description.toLowerCase();
      const tags = video.snippet.tags?.join(' ').toLowerCase() || '';

      return (
        title.includes(searchTerm) ||
        channel.includes(searchTerm) ||
        description.includes(searchTerm) ||
        tags.includes(searchTerm)
      );
    });
  }

  return filteredVideos;
}

// 排序视频
export function sortVideos(
  videos: VideoWithCategory[],
  sortBy: 'views' | 'likes' | 'date' | 'title' | 'default'
): VideoWithCategory[] {
  const sortedVideos = [...videos];

  switch (sortBy) {
    case 'views':
      sortedVideos.sort((a, b) =>
        parseInt(b.statistics.viewCount || '0') - parseInt(a.statistics.viewCount || '0')
      );
      break;
    case 'likes':
      sortedVideos.sort((a, b) =>
        parseInt(b.statistics.likeCount || '0') - parseInt(a.statistics.likeCount || '0')
      );
      break;
    case 'date':
      sortedVideos.sort((a, b) =>
        new Date(b.snippet.publishedAt).getTime() - new Date(a.snippet.publishedAt).getTime()
      );
      break;
    case 'title':
      sortedVideos.sort((a, b) =>
        a.snippet.title.localeCompare(b.snippet.title)
      );
      break;
    default:
      // 默认顺序，不排序
      break;
  }

  return sortedVideos;
}

// 获取视频统计信息
export function getVideoStats() {
  const allVideos = getAllVideos();

  const totalViews = allVideos.reduce((sum, video) =>
    sum + parseInt(video.statistics.viewCount || '0'), 0
  );

  const totalLikes = allVideos.reduce((sum, video) =>
    sum + parseInt(video.statistics.likeCount || '0'), 0
  );

  const totalComments = allVideos.reduce((sum, video) =>
    sum + parseInt(video.statistics.commentCount || '0'), 0
  );

  // 按类别统计
  const categoryStats: Record<string, number> = {};
  allVideos.forEach((video) => {
    const categoryName = video.categoryName || 'Unknown';
    categoryStats[categoryName] = (categoryStats[categoryName] || 0) + 1;
  });

  return {
    totalVideos: allVideos.length,
    totalViews,
    totalLikes,
    totalComments,
    categoryStats,
  };
}