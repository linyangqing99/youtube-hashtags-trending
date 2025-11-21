/**
 * YouTube API 原始数据测试页面
 * 直接展示 YouTube API 的输入输出，不做任何数据处理
 */

'use client';

import { useState, useEffect } from 'react';

interface ApiTestResult {
  success: boolean;
  request?: {
    url: string;
    method: string;
    params: any;
  };
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: any;
  };
  analysis?: {
    itemCount: number;
    hasTags: boolean;
    tagsCount: number;
    hasPageToken: boolean;
    totalResults: number;
    resultsPerPage: number;
  };
  performance?: {
    responseTime: string;
    timestamp: string;
  };
  error?: string;
  stack?: string;
}

export default function ApiTestPage() {
  const [testResult, setTestResult] = useState<ApiTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [params, setParams] = useState({
    regionCode: 'US',
    maxResults: '5',
    pageToken: '',
  });

  const runTest = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      const queryParams = new URLSearchParams(params);
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.set(key, value);
      });

      const response = await fetch(`/api/youtube-raw-curl?${queryParams}`);
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
            YouTube API 原始数据测试
          </h1>

          {/* 测试参数设置 */}
          <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              API 参数设置
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
                  每页结果数
                </label>
                <input
                  type="number"
                  value={params.maxResults}
                  onChange={(e) => setParams({ ...params, maxResults: e.target.value })}
                  min="1"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  页面令牌
                </label>
                <input
                  type="text"
                  value={params.pageToken}
                  onChange={(e) => setParams({ ...params, pageToken: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="可选"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={runTest}
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? '测试中...' : '发送请求'}
                </button>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">正在调用 YouTube API...</p>
            </div>
          )}

          {testResult && !isLoading && (
            <div className="space-y-6">
              {/* 测试结果概览 */}
              <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'} border`}>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${testResult.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {testResult.success ? 'API 调用成功' : 'API 调用失败'}
                  </h2>
                </div>
                {testResult.error && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{testResult.error}</p>
                )}
              </div>

              {testResult.success && testResult.response && testResult.request && (
                <>
                  {/* 性能指标 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">响应时间</h3>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                        {testResult.performance?.responseTime}
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-green-600 dark:text-green-400">状态码</h3>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                        {testResult.response.status}
                      </p>
                    </div>
                  </div>

                  {/* 数据分析 */}
                  {testResult.analysis && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        数据分析
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">视频数量:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">
                            {testResult.analysis.itemCount}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">包含标签:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">
                            {testResult.analysis.hasTags ? '是' : '否'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">标签总数:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">
                            {testResult.analysis.tagsCount}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">有下一页:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">
                            {testResult.analysis.hasPageToken ? '是' : '否'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">总结果数:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">
                            {testResult.analysis.totalResults}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">每页结果:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">
                            {testResult.analysis.resultsPerPage}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 请求信息 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      请求信息
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <strong>URL:</strong> {testResult.request.url}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>方法:</strong> {testResult.request.method}
                      </p>
                    </div>
                  </div>

                  {/* 响应数据 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      原始响应数据 (JSON)
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg overflow-x-auto">
                      <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {JSON.stringify(testResult.response.data, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {/* 标签示例 */}
                  {testResult.analysis?.hasTags && testResult.response?.data?.items && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        标签示例
                      </h3>
                      <div className="space-y-2">
                        {testResult.response.data.items
                          .filter((item: any) => item.snippet?.tags?.length > 0)
                          .slice(0, 3)
                          .map((item: any, index: number) => (
                            <div key={item.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                {index + 1}. {item.snippet.title}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {item.snippet.tags?.map((tag: string) => (
                                  <span
                                    key={tag}
                                    className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
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