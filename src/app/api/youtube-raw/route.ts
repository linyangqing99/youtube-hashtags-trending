/**
 * YouTube API 原始数据测试接口
 * 直接展示 YouTube API 的输入输出，不做任何数据处理
 */

import { NextRequest, NextResponse } from 'next/server';
import { bootstrap } from 'global-agent';

// 初始化全局代理
if (process.env.https_proxy || process.env.HTTPS_PROXY) {
  bootstrap();
}

// YouTube API 配置 - 从环境变量获取
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    if (!YOUTUBE_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'YouTube API密钥未配置，请设置 YOUTUBE_API_KEY 环境变量' },
        { status: 500 }
      );
    }

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const regionCode = searchParams.get('regionCode') || 'US';
    const maxResults = parseInt(searchParams.get('maxResults') || '5');
    const pageToken = searchParams.get('pageToken') || undefined;

    // 构建请求参数
    const apiParams = new URLSearchParams();
    apiParams.set('part', 'snippet,statistics');
    apiParams.set('chart', 'mostPopular');
    apiParams.set('regionCode', regionCode);
    apiParams.set('maxResults', maxResults.toString());
    apiParams.set('key', YOUTUBE_API_KEY);
    if (pageToken) {
      apiParams.set('pageToken', pageToken);
    }

    // 记录请求信息
    const requestInfo = {
      url: `${YOUTUBE_API_BASE_URL}/videos?${apiParams.toString()}`,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      params: {
        part: 'snippet,statistics',
        chart: 'mostPopular',
        regionCode,
        maxResults,
        pageToken,
        key: YOUTUBE_API_KEY.substring(0, 10) + '...', // 部分隐藏
      }
    };

    console.log('YouTube API 请求:', requestInfo.url);

    // 发送 API 请求（Node.js会自动使用环境变量中的代理设置）
    const response = await fetch(requestInfo.url, {
      method: requestInfo.method,
      headers: requestInfo.headers,
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // 获取响应头信息
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      if (key.toLowerCase().includes('youtube') ||
          key.toLowerCase().includes('content-type') ||
          key.toLowerCase().includes('x-ratelimit')) {
        responseHeaders[key] = value;
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        success: false,
        request: requestInfo,
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          body: errorText,
        },
        performance: {
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString(),
        },
        error: 'YouTube API 请求失败',
      }, { status: response.status });
    }

    // 获取响应数据
    const responseData = await response.json();

    // 分析返回的数据
    const dataAnalysis = {
      itemCount: responseData.items?.length || 0,
      hasTags: responseData.items?.some((item: any) =>
        item.snippet?.tags && item.snippet.tags.length > 0
      ) || false,
      tagsCount: responseData.items?.reduce((total: number, item: any) =>
        total + (item.snippet?.tags?.length || 0), 0
      ) || 0,
      hasPageToken: !!responseData.nextPageToken,
      totalResults: responseData.pageInfo?.totalResults || 0,
      resultsPerPage: responseData.pageInfo?.resultsPerPage || 0,
    };

    // 返回完整的请求和响应信息
    return NextResponse.json({
      success: true,
      request: requestInfo,
      response: {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data: responseData, // 原始 API 响应数据
      },
      analysis: dataAnalysis,
      performance: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    return NextResponse.json({
      success: false,
      request: {
        url: '请求失败',
        method: 'GET',
      },
      response: null,
      performance: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      },
      error: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
