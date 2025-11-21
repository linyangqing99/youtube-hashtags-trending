'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SupabaseTestPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = async (testType: string = 'all') => {
    setIsLoading(true);
    setError(null);
    setTestResult(null);

    try {
      const response = await fetch(`/api/test-supabase?test=${testType}`);
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

  const runCustomTest = async () => {
    // 使用示例数据进行自定义测试
    const sampleVideoData = {
      kind: "youtube#video",
      etag: "test",
      id: "test-video-id",
      snippet: {
        publishedAt: "2025-11-19T17:01:34Z",
        channelId: "test-channel-id",
        title: "Amazing #Tech Video - #JavaScript Tutorial",
        description: "Learn #JavaScript and #React in this amazing tutorial! #coding #developer",
        thumbnails: {
          default: { url: "https://example.com/default.jpg", width: 120, height: 90 },
          medium: { url: "https://example.com/medium.jpg", width: 320, height: 180 },
          high: { url: "https://example.com/high.jpg", width: 480, height: 360 }
        },
        channelTitle: "Test Channel",
        tags: ["JavaScript", "React", "Tutorial", "Web Development"],
        categoryId: "28",
        liveBroadcastContent: "none",
        defaultLanguage: "en",
        localized: {
          title: "Amazing #Tech Video - #JavaScript Tutorial",
          description: "Learn #JavaScript and #React in this amazing tutorial! #coding #developer"
        },
        defaultAudioLanguage: "en"
      },
      statistics: {
        viewCount: "10000",
        likeCount: "500",
        favoriteCount: "0",
        commentCount: "50"
      }
    };

    setIsLoading(true);
    setError(null);
    setTestResult(null);

    try {
      const response = await fetch('/api/test-supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoData: sampleVideoData,
          testMode: 'extraction-only'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '自定义测试失败');
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
          <h1 className="text-3xl font-bold text-gray-900">Supabase集成测试</h1>
          <p className="text-gray-600 mt-2">
            测试数据库连接、hashtag提取算法和数据入库功能
          </p>
        </div>

        {/* 测试按钮 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">连接测试</CardTitle>
              <CardDescription>测试Supabase数据库连接</CardDescription>
            </CardHeader>
            <CardContent>
              <button
                onClick={() => runTest('connection')}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? '测试中...' : '测试连接'}
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hashtag提取测试</CardTitle>
              <CardDescription>测试hashtag提取算法</CardDescription>
            </CardHeader>
            <CardContent>
              <button
                onClick={() => runTest('hashtag-extraction')}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? '测试中...' : '测试提取'}
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">完整功能测试</CardTitle>
              <CardDescription>测试所有功能</CardDescription>
            </CardHeader>
            <CardContent>
              <button
                onClick={() => runTest('all')}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {isLoading ? '测试中...' : '完整测试'}
              </button>
            </CardContent>
          </Card>
        </div>

        {/* 自定义测试 */}
        <Card>
          <CardHeader>
            <CardTitle>自定义数据测试</CardTitle>
            <CardDescription>使用自定义视频数据测试hashtag提取</CardDescription>
          </CardHeader>
          <CardContent>
            <button
              onClick={runCustomTest}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
            >
              {isLoading ? '测试中...' : '自定义测试'}
            </button>
          </CardContent>
        </Card>

        {/* 错误显示 */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">错误</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-red-700 whitespace-pre-wrap">
                {error}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* 测试结果显示 */}
        {testResult && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>测试结果</CardTitle>
                <CardDescription>
                  {testResult.success ? (
                    <span className="text-green-600">✅ 测试成功</span>
                  ) : (
                    <span className="text-red-600">❌ 测试失败</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 性能信息 */}
                  {testResult.performance && (
                    <div>
                      <h4 className="font-semibold mb-2">性能信息</h4>
                      <div className="bg-gray-100 p-3 rounded text-sm">
                        <p>响应时间: {testResult.performance.totalResponseTime || testResult.performance.responseTime}</p>
                        <p>时间戳: {testResult.performance.timestamp}</p>
                      </div>
                    </div>
                  )}

                  {/* 环境配置 */}
                  {testResult.environment && (
                    <div>
                      <h4 className="font-semibold mb-2">环境配置</h4>
                      <div className="bg-gray-100 p-3 rounded text-sm">
                        <p>Node环境: {testResult.environment.nodeEnv}</p>
                        <p>Supabase URL: {testResult.environment.hasSupabaseUrl ? '✅ 已配置' : '❌ 未配置'}</p>
                        <p>Supabase Anon Key: {testResult.environment.hasSupabaseAnonKey ? '✅ 已配置' : '❌ 未配置'}</p>
                        <p>Supabase Service Key: {testResult.environment.hasSupabaseServiceKey ? '✅ 已配置' : '❌ 未配置'}</p>
                        {testResult.environment.supabaseUrlPrefix && (
                          <p>URL前缀: {testResult.environment.supabaseUrlPrefix}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 测试详情 */}
                  {testResult.testResults && (
                    <div>
                      <h4 className="font-semibold mb-2">测试详情</h4>
                      <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-96">
                        {JSON.stringify(testResult.testResults, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* 自定义测试结果 */}
                  {testResult.results && (
                    <div>
                      <h4 className="font-semibold mb-2">自定义测试结果</h4>
                      <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-96">
                        {JSON.stringify(testResult.results, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* 总结信息 */}
                  {testResult.summary && (
                    <div>
                      <h4 className="font-semibold mb-2">测试总结</h4>
                      <div className="bg-gray-100 p-3 rounded text-sm">
                        <p>总测试数: {testResult.summary.totalTests}</p>
                        <p>成功测试: {testResult.summary.successfulTests}</p>
                        <p>失败测试: {testResult.summary.failedTests}</p>
                        <p>整体状态: {testResult.summary.overallSuccess ? '✅ 成功' : '❌ 失败'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}