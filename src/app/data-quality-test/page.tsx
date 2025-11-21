/**
 * 数据质量和完整性测试页面
 * 使用示例数据测试 hashtag 提取算法和数据质量
 */

'use client';

import { useState, useEffect } from 'react';

interface DataQualityTestResult {
  success: boolean;
  request?: {
    pageCount: number;
    itemsPerPage: number;
    totalExpectedVideos: number;
  };
  results?: {
    pagination: {
      requestedPages: number;
      successfulPages: number;
      totalVideosRetrieved: number;
      expectedVideos: number;
      paginationTokens: Array<{
        pageNum: number;
        hasPrevToken: boolean;
        hasNextToken: boolean;
      }>;
    };
    hashtagAnalysis: {
      hashtags: Array<{
        tag: string;
        mentions: number;
        videos: Array<any>;
      }>;
      totalVideos: number;
      totalHashtags: number;
      topHashtags: Array<{
        tag: string;
        mentions: number;
        videos: Array<any>;
      }>;
      generatedAt: string;
    };
    dataQuality: {
      videoAnalysis: {
        totalVideos: number;
        videosWithTags: number;
        averageTagsPerVideo: number;
        videosWithHashtagsInText: number;
      };
      hashtagAnalysis: {
        totalUniqueHashtags: number;
        averageMentionsPerHashtag: number;
        topHashtags: Array<{
          tag: string;
          mentions: number;
          videos: Array<any>;
        }>;
        hashtagDistribution: {
          singleMention: number;
          multipleMentions: number;
          highFrequency: number;
        };
      };
      contentQuality: {
        dateRange: {
          earliest: string;
          latest: string;
        };
        channelDiversity: number;
        categoryDistribution: Record<string, number>;
      };
    };
    heatmap: {
      generatedFor: number;
      sampleData: Array<{
        tag: string;
        dailyData: Record<string, number>;
        totalMentions: number;
      }>;
      totalHashtagsWithHeatmap: number;
    };
  };
  performance?: {
    processingTime: string;
    videosProcessed: number;
    hashtagsExtracted: number;
    averageProcessingTimePerVideo: string;
    timestamp: string;
  };
  metadata?: {
    testType: string;
    dataSource: string;
    note: string;
  };
  error?: string;
  stack?: string;
}

export default function DataQualityTestPage() {
  const [testResult, setTestResult] = useState<DataQualityTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [params, setParams] = useState({
    pageCount: '3',
    itemsPerPage: '5',
  });

  const runTest = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      const queryParams = new URLSearchParams({
        pageCount: params.pageCount,
        itemsPerPage: params.itemsPerPage,
      });

      const response = await fetch(`/api/data-quality-test?${queryParams}`);
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
            数据质量和完整性测试
          </h1>

          {/* 测试参数设置 */}
          <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              测试参数设置
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  模拟页数
                </label>
                <input
                  type="number"
                  value={params.pageCount}
                  onChange={(e) => setParams({ ...params, pageCount: e.target.value })}
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  每页视频数
                </label>
                <input
                  type="number"
                  value={params.itemsPerPage}
                  onChange={(e) => setParams({ ...params, itemsPerPage: e.target.value })}
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
              <p className="mt-4 text-gray-600 dark:text-gray-400">正在测试数据质量和完整性...</p>
            </div>
          )}

          {testResult && !isLoading && (
            <div className="space-y-6">
              {/* 测试结果概览 */}
              <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'} border`}>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${testResult.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {testResult.success ? '数据质量测试完成' : '测试失败'}
                  </h2>
                </div>
                {testResult.error && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{testResult.error}</p>
                )}
                {testResult.metadata && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {testResult.metadata.note}
                  </p>
                )}
              </div>

              {testResult.success && testResult.results && testResult.request && (
                <>
                  {/* 性能指标 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">处理时间</h3>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                        {testResult.performance?.processingTime}
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-green-600 dark:text-green-400">处理视频数</h3>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                        {testResult.performance?.videosProcessed}
                      </p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-purple-600 dark:text-purple-400">提取Hashtags</h3>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                        {testResult.performance?.hashtagsExtracted}
                      </p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-orange-600 dark:text-orange-400">平均处理速度</h3>
                      <p className="text-2xl font-bold text-orange-900 dark:text-orange-100 mt-1">
                        {testResult.performance?.averageProcessingTimePerVideo}/视频
                      </p>
                    </div>
                  </div>

                  {/* 分页验证结果 */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      分页功能验证
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">请求页数:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {testResult.results.pagination.requestedPages}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">成功页数:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {testResult.results.pagination.successfulPages}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">获取视频数:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {testResult.results.pagination.totalVideosRetrieved}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">预期视频数:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {testResult.results.pagination.expectedVideos}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {testResult.results.pagination.paginationTokens.map((token) => (
                        <div key={token.pageNum} className="flex items-center space-x-2 text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            第{token.pageNum}页:
                          </span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            token.hasPrevToken ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200'
                          }`}>
                            上一页 {token.hasPrevToken ? '✓' : '✗'}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            token.hasNextToken ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200'
                          }`}>
                            下一页 {token.hasNextToken ? '✓' : '✗'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 数据质量分析 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      数据质量分析
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">视频数据质量</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">总视频数:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {testResult.results.dataQuality.videoAnalysis.totalVideos}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">含标签视频:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {testResult.results.dataQuality.videoAnalysis.videosWithTags}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">平均标签数:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {testResult.results.dataQuality.videoAnalysis.averageTagsPerVideo.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">含#文本视频:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {testResult.results.dataQuality.videoAnalysis.videosWithHashtagsInText}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Hashtag质量</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">唯一Hashtags:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {testResult.results.dataQuality.hashtagAnalysis.totalUniqueHashtags}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">平均提及数:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {testResult.results.dataQuality.hashtagAnalysis.averageMentionsPerHashtag.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">单次提及:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {testResult.results.dataQuality.hashtagAnalysis.hashtagDistribution.singleMention}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">多次提及:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {testResult.results.dataQuality.hashtagAnalysis.hashtagDistribution.multipleMentions}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">内容多样性</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">频道数量:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {testResult.results.dataQuality.contentQuality.channelDiversity}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">时间跨度:</span>
                            <span className="font-medium text-gray-900 dark:text-white text-xs">
                              {new Date(testResult.results.dataQuality.contentQuality.dateRange.earliest).toLocaleDateString()} - {new Date(testResult.results.dataQuality.contentQuality.dateRange.latest).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">类别分布:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {Object.keys(testResult.results.dataQuality.contentQuality.categoryDistribution).length} 个类别
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 热门Hashtags */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      热门Hashtags (Top 10)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {testResult.results.dataQuality.hashtagAnalysis.topHashtags.slice(0, 10).map((hashtag, index) => (
                        <div key={hashtag.tag} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <div className="flex items-center">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-2">
                              #{index + 1}
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white text-sm">
                              #{hashtag.tag}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {hashtag.mentions} 次提及
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 热力图数据样本 */}
                  {testResult.results.heatmap.sampleData.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        热力图数据样本 (7天活动)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {testResult.results.heatmap.sampleData.map((hashtagData) => (
                          <div key={hashtagData.tag} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                              #{hashtagData.tag}
                            </h4>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              总提及: {hashtagData.totalMentions}
                            </div>
                            <div className="space-y-1">
                              {Object.entries(hashtagData.dailyData).map(([date, count]) => (
                                <div key={date} className="flex justify-between text-xs">
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {new Date(date).toLocaleDateString()}
                                  </span>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {count}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 测试元数据 */}
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
                    <div>测试类型: {testResult.metadata?.testType}</div>
                    <div>数据源: {testResult.metadata?.dataSource}</div>
                    <div>生成时间: {new Date(testResult.performance?.timestamp || '').toLocaleString()}</div>
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