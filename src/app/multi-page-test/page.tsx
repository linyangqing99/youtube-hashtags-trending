/**
 * YouTube API 多页数据获取测试页面
 * 用于测试分页功能、API限制和数据完整性
 */

'use client';

import { useState, useEffect } from 'react';

interface MultiPageTestResult {
  success: boolean;
  request?: {
    regionCode: string;
    maxPages: number;
    maxResultsPerPage: number;
    totalApiCalls: number;
  };
  results?: {
    pages: Array<{
      pageNum: number;
      pageToken?: string;
      nextPageToken?: string;
      prevPageToken?: string;
      itemCount: number;
      hasTags: boolean;
      tagsCount: number;
      apiResponseTime: number;
      error?: string;
    }>;
    summary: {
      totalPagesAttempted: number;
      totalPagesSuccessful: number;
      totalVideos: number;
      totalTags: number;
      totalApiCalls: number;
      totalTime: number;
      averageResponseTime: number;
      rateLimitInfo: Record<string, any>;
    };
    errors: Array<{
      page: number;
      error: string;
      details?: any;
    }>;
  };
  performance?: {
    totalTime: string;
    averageResponseTime: string;
    timestamp: string;
  };
  apiLimitTest?: {
    rateLimitHeaders: Record<string, string>;
    quotaUsage: {
      estimatedRequestsUsed: number;
      estimatedRequestsRemaining: string;
    };
  };
  error?: string;
  stack?: string;
}

export default function MultiPageTestPage() {
  const [testResult, setTestResult] = useState<MultiPageTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [params, setParams] = useState({
    regionCode: 'US',
    maxPages: '3',
    maxResultsPerPage: '10',
  });

  const runTest = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      const queryParams = new URLSearchParams({
        regionCode: params.regionCode,
        maxPages: params.maxPages,
        maxResultsPerPage: params.maxResultsPerPage,
      });

      const response = await fetch(`/api/multi-page-test?${queryParams}`);
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 页面加载时自动运行基础测试
  useEffect(() => {
    runTest();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            YouTube API 多页数据获取测试
          </h1>

          {/* 测试参数设置 */}
          <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              测试参数设置
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  国家代码
                </label>
                <input
                  type="text"
                  value={params.regionCode}
                  onChange={(e) => setParams({ ...params, regionCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="US"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  最大页数
                </label>
                <input
                  type="number"
                  value={params.maxPages}
                  onChange={(e) => setParams({ ...params, maxPages: e.target.value })}
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  每页结果数
                </label>
                <input
                  type="number"
                  value={params.maxResultsPerPage}
                  onChange={(e) => setParams({ ...params, maxResultsPerPage: e.target.value })}
                  min="1"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={runTest}
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? '测试中...' : '开始测试'}
                </button>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">正在测试多页数据获取...</p>
            </div>
          )}

          {testResult && !isLoading && (
            <div className="space-y-6">
              {/* 测试结果概览 */}
              <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'} border`}>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${testResult.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {testResult.success ? '多页测试完成' : '测试失败'}
                  </h2>
                </div>
                {testResult.error && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{testResult.error}</p>
                )}
              </div>

              {testResult.success && testResult.results && testResult.request && (
                <>
                  {/* 总体统计 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">成功页数</h3>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                        {testResult.results.summary.totalPagesSuccessful}/{testResult.request.maxPages}
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-green-600 dark:text-green-400">总视频数</h3>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                        {testResult.results.summary.totalVideos}
                      </p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-purple-600 dark:text-purple-400">总标签数</h3>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                        {testResult.results.summary.totalTags}
                      </p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-orange-600 dark:text-orange-400">平均响应时间</h3>
                      <p className="text-2xl font-bold text-orange-900 dark:text-orange-100 mt-1">
                        {testResult.results.summary.averageResponseTime}ms
                      </p>
                    </div>
                  </div>

                  {/* API 使用情况 */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      API 使用情况
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">API 调用次数:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {testResult.results.summary.totalApiCalls}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">预估配额使用:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {testResult.apiLimitTest?.quotaUsage.estimatedRequestsUsed} units
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">总耗时:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {testResult.performance?.totalTime}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">测试时间:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {new Date(testResult.performance?.timestamp || '').toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 分页详情 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      分页详情
                    </h3>
                    <div className="space-y-2">
                      {testResult.results.pages.map((page) => (
                        <div
                          key={page.pageNum}
                          className={`p-3 rounded-lg border ${
                            page.error
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                              : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-20">
                                第 {page.pageNum} 页
                              </span>
                              {page.error ? (
                                <span className="text-red-600 dark:text-red-400 text-sm">
                                  {page.error}
                                </span>
                              ) : (
                                <div className="flex items-center space-x-4 text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {page.itemCount} 个视频
                                  </span>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {page.tagsCount} 个标签
                                  </span>
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    page.hasTags
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                                      : 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200'
                                  }`}>
                                    {page.hasTags ? '有标签' : '无标签'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                              {page.apiResponseTime}ms
                            </div>
                          </div>
                          {!page.error && (
                            <div className="mt-2 flex space-x-2 text-xs text-gray-500 dark:text-gray-400">
                              {page.prevPageToken && (
                                <span>← 有上一页</span>
                              )}
                              {page.nextPageToken && (
                                <span>有下一页 →</span>
                              )}
                              {!page.prevPageToken && !page.nextPageToken && (
                                <span>只有这一页</span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 错误信息 */}
                  {testResult.results.errors.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-3">
                        错误信息
                      </h3>
                      <div className="space-y-2">
                        {testResult.results.errors.map((error, index) => (
                          <div key={index} className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                            <div className="text-sm font-medium text-red-800 dark:text-red-200">
                              第 {error.page} 页: {error.error}
                            </div>
                            {error.details && (
                              <pre className="mt-1 text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap">
                                {typeof error.details === 'string' ? error.details : JSON.stringify(error.details, null, 2)}
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}