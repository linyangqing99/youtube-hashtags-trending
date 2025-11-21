'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { VideoWithCategory } from '@/types/youtube';
import { formatNumber, formatDate, truncateText, getYouTubeUrl, getThumbnailUrl } from '@/lib/utils';
import { formatLanguage } from '@/lib/categories';
import { Eye, ThumbsUp, MessageCircle, Star, Calendar, ExternalLink, Globe, Volume2 } from 'lucide-react';

interface VideoCardProps {
  video: VideoWithCategory;
  compact?: boolean;
  onClick?: (video: VideoWithCategory) => void;
}

export function VideoCard({ video, compact = false, onClick }: VideoCardProps) {
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick(video);
    } else {
      window.open(getYouTubeUrl(video.id), '_blank');
    }
  };

  const thumbnailUrl = imageError
    ? 'https://via.placeholder.com/480x360/1a1a1a/ffffff?text=Video+Not+Available'
    : getThumbnailUrl(video.snippet.thumbnails);

  return (
    <motion.div
      className={`video-card overflow-hidden ${compact ? 'cursor-pointer' : ''}`}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onClick={compact ? handleClick : undefined}
    >
      {/* 视频缩略图 */}
      <div className="relative group">
        <img
          src={thumbnailUrl}
          alt={video.snippet.title}
          className="video-thumbnail"
          onError={() => setImageError(true)}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
          <ExternalLink className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>
      </div>

      {/* 视频信息 */}
      <div className="p-4 space-y-3">
        {/* 标题 */}
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight">
          {compact ? truncateText(video.snippet.title, 60) : video.snippet.title}
        </h3>

        {/* 类别和语言标签 */}
        <div className="flex flex-wrap gap-2 items-center">
          {video.categoryName && (
            <span className="category-badge">
              🏷️ {video.categoryName}
            </span>
          )}
          {video.snippet.defaultLanguage && (
            <span className="language-badge">
              <Globe className="w-3 h-3 mr-1" />
              {formatLanguage(video.snippet.defaultLanguage)}
            </span>
          )}
          {video.snippet.defaultAudioLanguage && (
            <span className="language-badge">
              <Volume2 className="w-3 h-3 mr-1" />
              {formatLanguage(video.snippet.defaultAudioLanguage)}
            </span>
          )}
        </div>

        {/* 频道信息 */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <div className="font-medium text-gray-900 dark:text-gray-100">{video.snippet.channelTitle}</div>
        </div>

        {/* 统计数据 */}
        <div className="video-stats flex-wrap">
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{formatNumber(video.statistics.viewCount)}</span>
          </div>
          <div className="flex items-center gap-1">
            <ThumbsUp className="w-4 h-4" />
            <span>{formatNumber(video.statistics.likeCount)}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            <span>{formatNumber(video.statistics.commentCount)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4" />
            <span>{formatNumber(video.statistics.favoriteCount)}</span>
          </div>
        </div>

        {!compact && (
          <>
            {/* 发布时间 */}
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(video.snippet.publishedAt)}</span>
            </div>

            {/* 视频描述 */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="line-clamp-3">
                {truncateText(video.snippet.description || '暂无描述', 150)}
              </p>
            </div>

            {/* 标签 */}
            {video.snippet.tags && video.snippet.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {video.snippet.tags.slice(0, 6).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
                {video.snippet.tags.length > 6 && (
                  <span className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md">
                    +{video.snippet.tags.length - 6} 更多
                  </span>
                )}
              </div>
            )}

            {/* 技术信息 */}
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div>视频ID: <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">{video.id}</code></div>
              <div>频道ID: <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs break-all">{video.snippet.channelId}</code></div>
              <div>类别ID: <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">{video.snippet.categoryId || 'N/A'}</code></div>
              <div>直播状态: <span className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">{video.snippet.liveBroadcastContent || 'N/A'}</span></div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

export default VideoCard;