'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, RotateCcw, Download, Moon, Sun } from 'lucide-react';
import { getAllCategories } from '@/lib/categories';
import { debounce } from '@/lib/utils';

interface SearchBarProps {
  onSearch: (query: string, categoryId: string) => void;
  onExport?: (format: 'csv' | 'json') => void;
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
  totalCount?: number;
  filteredCount?: number;
}

export function SearchBar({
  onSearch,
  onExport,
  onThemeToggle,
  isDarkMode = false,
  totalCount = 0,
  filteredCount = 0,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories] = useState(getAllCategories());

  // 防抖搜索
  const debouncedSearch = debounce((searchQuery: string, searchCategoryId: string) => {
    onSearch(searchQuery, searchCategoryId);
  }, 300);

  useEffect(() => {
    debouncedSearch(query, categoryId);
  }, [query, categoryId, debouncedSearch]);

  const handleReset = () => {
    setQuery('');
    setCategoryId('');
    onSearch('', '');
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (onExport) {
      onExport(format);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 space-y-4">
      {/* 搜索和筛选控件 */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 搜索输入框 */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
          <input
            type="text"
            placeholder="搜索视频标题、频道、描述或标签..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input pl-10 pr-4 py-3"
          />
        </div>

        {/* 类别筛选 */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="search-input pl-10 pr-8 py-3 appearance-none bg-white dark:bg-gray-800"
          >
            <option value="">所有类别</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="filter-button flex items-center gap-2 px-4 py-3"
            title="重置筛选"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">重置</span>
          </button>

          {/* 主题切换按钮 */}
          {onThemeToggle && (
            <button
              onClick={onThemeToggle}
              className="filter-button flex items-center gap-2 px-4 py-3"
              title={isDarkMode ? '切换到亮色模式' : '切换到暗色模式'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className="hidden sm:inline">主题</span>
            </button>
          )}

          {/* 导出按钮 */}
          {onExport && (
            <div className="relative group">
              <button className="filter-button flex items-center gap-2 px-4 py-3">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">导出</span>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-md"
                >
                  导出为 CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-md"
                >
                  导出为 JSON
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 筛选状态 */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        <div>
          {filteredCount === totalCount ? (
            <span>共 {totalCount} 个视频</span>
          ) : (
            <span>
              找到 {filteredCount} 个视频
              {query || categoryId ? (
                <>
                  {' '}（从 {totalCount} 个中筛选）
                  {(query || categoryId) && (
                    <span className="ml-2">
                      筛选条件：
                      {query && (
                        <span className="ml-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md text-xs">
                          搜索: "{query}"
                        </span>
                      )}
                      {categoryId && (
                        <span className="ml-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md text-xs">
                          类别: {categories.find(c => c.id === categoryId)?.name}
                        </span>
                      )}
                    </span>
                  )}
                </>
              ) : null}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchBar;