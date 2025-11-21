'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoWithCategory } from '@/types/youtube';
import VideoCard from './VideoCard';

interface VideoGridProps {
  videos: VideoWithCategory[];
  loading?: boolean;
  onVideoClick?: (video: VideoWithCategory) => void;
}

export function VideoGrid({ videos, loading = false, onVideoClick }: VideoGridProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (videoId: string) => {
    setImageErrors(prev => new Set(prev).add(videoId));
  };

  if (loading) {
    return (
      <div className="video-grid">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="video-card overflow-hidden">
            <div className="skeleton video-thumbnail" />
            <div className="p-4 space-y-3">
              <div className="skeleton skeleton-title" />
              <div className="skeleton skeleton-text" />
              <div className="skeleton skeleton-text" />
              <div className="skeleton skeleton-text w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-12 h-12 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">没有找到视频</h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md">
          尝试调整搜索条件或筛选设置，或者检查网络连接后重试。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 视频网格 */}
      <motion.div
        className="video-grid"
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence>
          {videos.map((video, index) => (
            <motion.div
              key={video.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                duration: 0.3,
                delay: index * 0.05,
              }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
            >
              <VideoCard
                video={video}
                onClick={onVideoClick}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* 加载更多提示（如果需要分页） */}
      {videos.length >= 20 && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            显示 {videos.length} 个视频
          </p>
        </div>
      )}
    </div>
  );
}

export default VideoGrid;