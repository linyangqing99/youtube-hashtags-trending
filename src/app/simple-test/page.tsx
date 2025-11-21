'use client';

import { useState } from 'react';

export default function SimpleTestPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = async (testType: string = 'all') => {
    setIsLoading(true);
    setError(null);
    setTestResult(null);

    try {
      const response = await fetch(`/api/simple-db-test?test=${testType}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '测试失败');
      }

      setTestResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🎯 简化版数据库测试</h1>
          <p className="text-gray-600 mt-2">
            测试3个核心表的功能：videos、hashtags、video_hashtags
          </p>
        </div>

        {/* 测试按钮 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => runTest('connection')}
            disabled={isLoading}
            className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            📡 测试连接
          </button>

          <button
            onClick={() => runTest('extraction')}
            disabled={isLoading}
            className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            🏷️ 测试提取
          </button>

          <button
            onClick={() => runTest('insert')}
            disabled={isLoading}
            className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            💾 测试插入
          </button>

          <button
            onClick={() => runTest('all')}
            disabled={isLoading}
            className="p-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            🚀 完整测试
          </button>
        </div>

        {/* 设置提醒 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800">📝 还没创建数据库表？</h3>
          <p className="text-yellow-700 mt-2">
            请先访问 <a href="https://isorrcmivuomzolnaxgi.supabase.co" target="_blank" className="underline" rel="noopener noreferrer">
              你的Supabase项目
            </a>，打开SQL编辑器，执行 <code className="bg-yellow-100 px-2 py-1 rounded">SIMPLE_DATABASE_SETUP.md</code> 中的SQL代码。
          </p>
        </div>

        {/* 错误显示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-800">❌ 错误</h3>
            <p className="text-red-700 mt-2">{error}</p>
          </div>
        )}

        {/* 测试结果显示 */}
        {testResult && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-800">
                {testResult.success ? '✅ 测试成功' : '❌ 测试失败'}
              </h3>
              {testResult.performance && (
                <p className="text-green-700 text-sm mt-1">
                  响应时间: {testResult.performance.responseTime}
                </p>
              )}
            </div>

            {/* 环境信息 */}
            {testResult.environment && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800">🌍 环境信息</h3>
                <div className="mt-2 space-y-1 text-sm">
                  <p>Supabase URL: {testResult.environment.hasSupabaseUrl ? '✅ 已配置' : '❌ 未配置'}</p>
                  <p>Supabase Key: {testResult.environment.hasSupabaseKey ? '✅ 已配置' : '❌ 未配置'}</p>
                  <p>项目URL: {testResult.environment.urlPrefix}</p>
                </div>
              </div>
            )}

            {/* 测试详情 */}
            {testResult.testResults && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 测试结果</h3>

                <div className="space-y-4">
                  {/* 连接测试 */}
                  {testResult.testResults.connection && (
                    <div>
                      <h4 className="font-semibold text-gray-700">📡 数据库连接</h4>
                      <div className="mt-1 p-3 bg-white rounded border">
                        <p>状态: {testResult.testResults.connection.success ? '✅ 成功' : '❌ 失败'}</p>
                        <p>消息: {testResult.testResults.connection.message}</p>
                      </div>
                    </div>
                  )}

                  {/* 提取测试 */}
                  {testResult.testResults.extraction && (
                    <div>
                      <h4 className="font-semibold text-gray-700">🏷️ Hashtag提取</h4>
                      <div className="mt-1 p-3 bg-white rounded border">
                        <p>视频标题: {testResult.testResults.extraction.videoTitle}</p>
                        <p>标题提取: {testResult.testResults.extraction.titleHashtags.join(', ')}</p>
                        <p>描述提取: {testResult.testResults.extraction.descriptionHashtags.join(', ')}</p>
                        <p>原生标签: {testResult.testResults.extraction.nativeTags.join(', ')}</p>
                        <p>总计: {testResult.testResults.extraction.totalExtracted} 个唯一hashtag</p>
                      </div>
                    </div>
                  )}

                  {/* 插入测试 */}
                  {testResult.testResults.videoInsert && (
                    <div>
                      <h4 className="font-semibold text-gray-700">💾 数据插入</h4>
                      <div className="mt-1 p-3 bg-white rounded border">
                        <p>视频插入: {testResult.testResults.videoInsert.success ? '✅ 成功' : '❌ 失败'}</p>
                        {testResult.testResults.hashtagInserts && (
                          <p>Hashtag插入: ✅ 成功插入 {testResult.testResults.hashtagInserts.insertedCount} 个</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 查询测试 */}
                  {testResult.testResults.query && (
                    <div>
                      <h4 className="font-semibold text-gray-700">🔍 数据查询</h4>
                      <div className="mt-1 p-3 bg-white rounded border">
                        <p>视频数量: {testResult.testResults.query.videos.count} 个</p>
                        <p>Hashtag数量: {testResult.testResults.query.hashtags.count} 个</p>

                        {testResult.testResults.query.hashtags.data && testResult.testResults.query.hashtags.data.length > 0 && (
                          <div className="mt-2">
                            <p className="font-medium">热门Hashtag:</p>
                            <ul className="ml-4 text-sm">
                              {testResult.testResults.query.hashtags.data.map((hashtag: any, index: number) => (
                                <li key={index}>• {hashtag.name} (使用 {hashtag.count} 次)</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}