/**
 * YouTube API 和 Hashtag 提取功能测试页面
 */

'use client';

import { useState, useEffect } from 'react';

interface TestResult {
  success: boolean;
  message: string;
  data?: {
    apiConnection: boolean;
    videosProcessed: number;
    hashtagsFound: number;
    topHashtags: Array<{
      tag: string;
      mentions: number;
      videos: number;
    }>;
    heatmapSample?: Record<string, any>;
    generatedAt: string;
  };
  error?: string;
}

export default function TestPage() {
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/test-youtube');
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: '请求失败',
        error: error instanceof Error ? error.message : '未知错误'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 页面加载时自动运行测试
    runTest();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            YouTube API & Hashtag 提取测试
          </h1>

          <div className="mb-6">
            <button
              onClick={runTest}
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '测试中...' : '重新运行测试'}
            </button>
          </div>

          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">正在测试 YouTube API 连接...</p>
            </div>
          )}

          {testResult && !isLoading && (
            <div className="space-y-6">
              {/* 测试结果概览 */}
              <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'} border`}>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${testResult.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {testResult.message}
                  </h2>
                </div>
                {testResult.error && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{testResult.error}</p>
                )}
              </div>

              {testResult.success && testResult.data && (
                <>
                  {/* 数据统计 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">API 连接状态</h3>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                        {testResult.data.apiConnection ? '成功' : '使用示例数据'}
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-green-600 dark:text-green-400">处理视频数</h3>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                        {testResult.data.videosProcessed}
                      </p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-purple-600 dark:text-purple-400">发现 Hashtags</h3>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                        {testResult.data.hashtagsFound}
                      </p>
                    </div>
                  </div>

                  {/* Top Hashtags */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">热门 Hashtags</h3>
                    <div className="space-y-2">
                      {testResult.data.topHashtags.map((hashtag, index) => (
                        <div key={hashtag.tag} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-8">
                              #{index + 1}
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              #{hashtag.tag}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {hashtag.mentions} 次提及 / {hashtag.videos} 个视频
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 热力图数据示例 */}
                  {testResult.data.heatmapSample && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">热力图数据示例</h3>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg overflow-x-auto">
                        <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                          {JSON.stringify(testResult.data.heatmapSample, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* 生成时间 */}
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
                    数据生成时间: {new Date(testResult.data.generatedAt).toLocaleString()}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}