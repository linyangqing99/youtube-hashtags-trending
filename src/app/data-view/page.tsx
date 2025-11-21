'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('缺少 Supabase 配置，请设置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function DataViewPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [hashtags, setHashtags] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'videos' | 'hashtags' | 'stats'>('stats');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 获取统计数据
      const { count: videoCount } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true });

      const { count: hashtagCount } = await supabase
        .from('hashtags')
        .select('*', { count: 'exact', head: true });

      const { count: relationCount } = await supabase
        .from('video_hashtags')
        .select('*', { count: 'exact', head: true });

      // 获取热门hashtags
      const { data: topHashtags } = await supabase
        .from('hashtags')
        .select('*')
        .order('count', { ascending: false })
        .limit(20);

      // 获取最新视频
      const { data: latestVideos } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setStats({
        videoCount,
        hashtagCount,
        relationCount,
        topHashtags: topHashtags || []
      });
      setVideos(latestVideos || []);
      setHashtags(topHashtags || []);
    } catch (error) {
      console.error('数据加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">正在加载数据...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📊 YouTube Hashtag 数据中心</h1>
          <p className="text-gray-600">美国地区前200热门视频数据分析</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">视频总数</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.videoCount || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hashtag总数</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.hashtagCount || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">关联总数</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.relationCount || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 热门Hashtags */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">🔥 热门Hashtags Top 20</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats?.topHashtags?.map((hashtag: any, index: number) => (
                <div key={hashtag.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-gray-500">#{index + 1}</span>
                    <span className="font-medium text-gray-900">#{hashtag.name}</span>
                  </div>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {hashtag.count}次
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 最新视频 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">📹 最新收集的视频</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {videos.map((video: any) => (
                <div key={video.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <h3 className="font-medium text-gray-900 mb-1">{video.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    频道: {video.channel_title} |
                    观看: {video.view_count?.toLocaleString()} |
                    点赞: {video.like_count?.toLocaleString()}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {video.tags && video.tags.length > 0 && (
                      video.tags.slice(0, 5).map((tag: string, index: number) => (
                        <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                          #{tag}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 刷新按钮 */}
        <div className="mt-8 text-center">
          <button
            onClick={loadData}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 刷新数据
          </button>
        </div>
      </div>
    </div>
  );
}
