/**
 * YouTube API 多页数据获取测试接口
 * 用于测试分页、API限制和数据完整性
 */

import { NextRequest, NextResponse } from 'next/server';

// YouTube API 配置 - 从环境变量获取
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

// 验证API密钥
if (!YOUTUBE_API_KEY) {
  throw new Error('YouTube API密钥未配置，请设置 YOUTUBE_API_KEY 环境变量');
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const regionCode = searchParams.get('regionCode') || 'US';
    const maxPages = parseInt(searchParams.get('maxPages') || '3');
    const maxResultsPerPage = parseInt(searchParams.get('maxResultsPerPage') || '10');

    console.log(`开始多页测试: region=${regionCode}, maxPages=${maxPages}, perPage=${maxResultsPerPage}`);

    const results = {
      pages: [] as Array<{
        pageNum: number;
        pageToken?: string;
        nextPageToken?: string;
        prevPageToken?: string;
        itemCount: number;
        hasTags: boolean;
        tagsCount: number;
        apiResponseTime: number;
        error?: string;
      }>,
      summary: {
        totalPagesAttempted: maxPages,
        totalPagesSuccessful: 0,
        totalVideos: 0,
        totalTags: 0,
        totalApiCalls: 0,
        totalTime: 0,
        averageResponseTime: 0,
        rateLimitInfo: {} as Record<string, any>,
      },
      errors: [] as Array<{ page: number; error: string; details?: any }>
    };

    let currentPageToken: string | undefined;

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const pageStartTime = Date.now();

      try {
        // 构建请求参数
        const apiParams = new URLSearchParams({
          part: 'snippet,statistics',
          chart: 'mostPopular',
          regionCode,
          maxResults: maxResultsPerPage.toString(),
          key: YOUTUBE_API_KEY,
          ...(currentPageToken ? { pageToken: currentPageToken } : {}),
        });

        const requestUrl = `${YOUTUBE_API_BASE_URL}/videos?${apiParams.toString()}`;
        console.log(`请求第 ${pageNum} 页: ${requestUrl.substring(0, 100)}...`);

        // 发送 API 请求
        const response = await fetch(requestUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        const apiResponseTime = Date.now() - pageStartTime;
        results.summary.totalApiCalls++;

        // 收集API限制信息
        const rateLimitHeaders = {} as Record<string, string>;
        response.headers.forEach((value, key) => {
          if (key.toLowerCase().includes('ratelimit') ||
              key.toLowerCase().includes('quota')) {
            rateLimitHeaders[key] = value;
          }
        });

        if (Object.keys(rateLimitHeaders).length > 0) {
          results.summary.rateLimitInfo = { ...results.summary.rateLimitInfo, ...rateLimitHeaders };
        }

        if (!response.ok) {
          const errorText = await response.text();
          const errorInfo = {
            page: pageNum,
            error: `HTTP ${response.status}: ${response.statusText}`,
            details: errorText.substring(0, 200) + (errorText.length > 200 ? '...' : '')
          };

          results.errors.push(errorInfo);
          results.pages.push({
            pageNum,
            itemCount: 0,
            hasTags: false,
            tagsCount: 0,
            apiResponseTime,
            error: errorInfo.error
          });

          // 如果遇到配额限制错误，停止继续请求
          if (response.status === 403 || response.status === 429) {
            console.log(`遇到API限制，停止在第 ${pageNum-1} 页`);
            break;
          }

          continue;
        }

        const responseData = await response.json();

        // 分析页面数据
        const itemCount = responseData.items?.length || 0;
        const hasTags = responseData.items?.some((item: any) =>
          item.snippet?.tags && item.snippet.tags.length > 0
        ) || false;
        const tagsCount = responseData.items?.reduce((total: number, item: any) =>
          total + (item.snippet?.tags?.length || 0), 0
        ) || 0;

        // 记录页面结果
        const pageInfo = {
          pageNum,
          pageToken: currentPageToken,
          nextPageToken: responseData.nextPageToken,
          prevPageToken: responseData.prevPageToken,
          itemCount,
          hasTags,
          tagsCount,
          apiResponseTime,
        };

        results.pages.push(pageInfo);
        results.summary.totalPagesSuccessful++;
        results.summary.totalVideos += itemCount;
        results.summary.totalTags += tagsCount;

        console.log(`第 ${pageNum} 页成功: ${itemCount} 个视频, ${tagsCount} 个标签, 响应时间: ${apiResponseTime}ms`);

        // 准备下一页的token
        currentPageToken = responseData.nextPageToken;

        if (!currentPageToken) {
          console.log(`第 ${pageNum} 页是最后一页，没有更多数据`);
          break;
        }

        // 添加请求间隔以避免触发API限制
        if (pageNum < maxPages && currentPageToken) {
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms间隔
        }

      } catch (error) {
        const apiResponseTime = Date.now() - pageStartTime;
        const errorInfo = {
          page: pageNum,
          error: error instanceof Error ? error.message : '未知错误',
          details: error instanceof Error ? error.stack : undefined
        };

        results.errors.push(errorInfo);
        results.pages.push({
          pageNum,
          itemCount: 0,
          hasTags: false,
          tagsCount: 0,
          apiResponseTime,
          error: errorInfo.error
        });

        console.error(`第 ${pageNum} 页请求失败:`, errorInfo.error);

        // 遇到网络错误时也停止继续请求
        break;
      }
    }

    // 计算总体统计
    results.summary.totalTime = Date.now() - startTime;
    results.summary.averageResponseTime = results.summary.totalPagesSuccessful > 0
      ? Math.round(results.pages.reduce((sum, page) => sum + page.apiResponseTime, 0) / results.summary.totalPagesSuccessful)
      : 0;

    return NextResponse.json({
      success: true,
      request: {
        regionCode,
        maxPages,
        maxResultsPerPage,
        totalApiCalls: results.summary.totalApiCalls,
      },
      results,
      performance: {
        totalTime: `${results.summary.totalTime}ms`,
        averageResponseTime: `${results.summary.averageResponseTime}ms`,
        timestamp: new Date().toISOString(),
      },
      apiLimitTest: {
        rateLimitHeaders: results.summary.rateLimitInfo,
        quotaUsage: {
          estimatedRequestsUsed: results.summary.totalApiCalls * 100, // 每个请求大约100 units
          estimatedRequestsRemaining: 'Unknown',
        }
      }
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      performance: {
        totalTime: `${totalTime}ms`,
        timestamp: new Date().toISOString(),
      },
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}