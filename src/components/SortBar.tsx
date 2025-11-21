'use client';

import React from 'react';
import { ArrowUpDown, Eye, ThumbsUp, Calendar, Type, List } from 'lucide-react';

type SortOption = 'default' | 'views' | 'likes' | 'date' | 'title';

interface SortBarProps {
  onSort: (sortBy: SortOption) => void;
  currentSort: SortOption;
  totalCount?: number;
}

export function SortBar({ onSort, currentSort, totalCount = 0 }: SortBarProps) {
  const sortOptions: Array<{
    value: SortOption;
    label: string;
    icon: React.ReactNode;
    description: string;
  }> = [
    {
      value: 'default',
      label: '默认顺序',
      icon: <List className="w-4 h-4" />,
      description: '按原始加载顺序显示'
    },
    {
      value: 'views',
      label: '观看量',
      icon: <Eye className="w-4 h-4" />,
      description: '按观看次数从高到低排序'
    },
    {
      value: 'likes',
      label: '点赞数',
      icon: <ThumbsUp className="w-4 h-4" />,
      description: '按点赞数从高到低排序'
    },
    {
      value: 'date',
      label: '发布时间',
      icon: <Calendar className="w-4 h-4" />,
      description: '按发布时间从新到旧排序'
    },
    {
      value: 'title',
      label: '标题',
      icon: <Type className="w-4 h-4" />,
      description: '按标题字母顺序排序'
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* 排序标题和总数 */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <span className="font-medium text-gray-900 dark:text-gray-100">排序方式</span>
          {totalCount > 0 && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              （共 {totalCount} 个视频）
            </span>
          )}
        </div>

        {/* 排序选项按钮 */}
        <div className="flex flex-wrap gap-2">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onSort(option.value)}
              className={`filter-button flex items-center gap-2 transition-all duration-200 ${
                currentSort === option.value ? 'active' : ''
              }`}
              title={option.description}
            >
              {option.icon}
              <span className="hidden sm:inline">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 当前排序说明 */}
      {currentSort !== 'default' && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <span>
              当前排序: {sortOptions.find(opt => opt.value === currentSort)?.description}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default SortBar;