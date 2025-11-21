/**
 * Supabase连接和hashtag提取测试接口
 * 用于验证数据库连接、hashtag提取算法和基础功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { testSupabaseConnection, createHashtag, createVideoHashtagRelations } from '../../../../lib/supabase';
import { extractHashtagsFromVideo, getHashtagExtractionStats } from '../../../../lib/hashtag-extractor';
import { YouTubeVideo } from '../../../../lib/supabase-types';

// 示例YouTube视频数据（基于你提供的真实数据）
const sampleVideoData: YouTubeVideo = {
  kind: "youtube#video",
  etag: "w9c2aooguBN7PyvB4vDydRg3QoE",
  id: "ppp7dMhzrz8",
  snippet: {
    publishedAt: "2025-11-19T17:01:34Z",
    channelId: "UCM1gEqLPsgej7ZKzu9w8v7A",
    title: "Lil Baby - Real Shit",
    description: "Music video by Lil Baby performing Real Shit.© 2025 Quality Control Music, LLC, under exclusive license to UMG Recordings, Inc.",
    thumbnails: {
      default: {
        url: "https://i.ytimg.com/vi/ppp7dMhzrz8/default.jpg",
        width: 120,
        height: 90
      },
      medium: {
        url: "https://i.ytimg.com/vi/ppp7dMhzrz8/mqdefault.jpg",
        width: 320,
        height: 180
      },
      high: {
        url: "https://i.ytimg.com/vi/ppp7dMhzrz8/hqdefault.jpg",
        width: 480,
        height: 360
      },
      standard: {
        url: "https://i.ytimg.com/vi/ppp7dMhzrz8/sddefault.jpg",
        width: 640,
        height: 480
      },
      maxres: {
        url: "https://i.ytimg.com/vi/ppp7dMhzrz8/maxresdefault.jpg",
        width: 1280,
        height: 720
      }
    },
    channelTitle: "LilBabyVEVO",
    tags: ["Lil Baby", "Quality Control Music/Motown Records", "Hip Hop"],
    categoryId: "10",
    liveBroadcastContent: "none",
    defaultLanguage: "en",
    localized: {
      title: "Lil Baby - Real Shit",
      description: "Music video by Lil Baby performing Real Shit.© 2025 Quality Control Music, LLC, under exclusive license to UMG Recordings, Inc."
    },
    defaultAudioLanguage: "en"
  },
  statistics: {
    viewCount: "361054",
    likeCount: "27160",
    favoriteCount: "0",
    commentCount: "2178"
  }
};

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const searchParams = request.nextUrl.searchParams;
    const testType = searchParams.get('test') || 'all';

    const results: any = {
      success: true,
      timestamp: new Date().toISOString(),
      testResults: {}
    };

    // 1. 测试Supabase连接
    if (testType === 'all' || testType === 'connection') {
      console.log('测试Supabase连接...');
      const connectionTest = await testSupabaseConnection();
      results.testResults.connection = connectionTest;
    }

    // 2. 测试hashtag提取算法
    if (testType === 'all' || testType === 'hashtag-extraction') {
      console.log('测试hashtag提取算法...');

      // 提取单个视频的hashtag
      const extractionResult = extractHashtagsFromVideo(sampleVideoData);

      // 计算提取统计信息
      const extractionStats = getHashtagExtractionStats([extractionResult]);

      results.testResults.hashtagExtraction = {
        videoId: sampleVideoData.id,
        videoTitle: sampleVideoData.snippet.title,
        extractedHashtags: extractionResult.hashtags,
        extractionStats: extractionResult.extractionStats,
        overallStats: extractionStats
      };
    }

    // 3. 测试hashtag创建
    if (testType === 'all' || testType === 'hashtag-creation') {
      console.log('测试hashtag创建...');

      const extractionResult = extractHashtagsFromVideo(sampleVideoData);
      const createdHashtags: any[] = [];

      for (const hashtag of extractionResult.hashtags.slice(0, 3)) { // 只测试前3个
        const createResult = await createHashtag(hashtag.name);
        createdHashtags.push({
          name: hashtag.name,
          result: createResult
        });
      }

      results.testResults.hashtagCreation = {
        testedCount: Math.min(3, extractionResult.hashtags.length),
        createdHashtags,
        success: createdHashtags.every(h => h.result.success)
      };
    }

    // 4. 测试hashtag关联创建
    if (testType === 'all' || testType === 'hashtag-relations') {
      console.log('测试hashtag关联创建...');

      const extractionResult = extractHashtagsFromVideo(sampleVideoData);
      const hashtagRelations = extractionResult.hashtags.slice(0, 2).map(hashtag => ({
        hashtagId: 1, // 使用一个测试ID
        source: hashtag.source,
        position: hashtag.position,
        confidence: hashtag.confidence
      }));

      const relationResult = await createVideoHashtagRelations(
        sampleVideoData.id,
        hashtagRelations
      );

      results.testResults.hashtagRelations = relationResult;
    }

    // 5. 环境配置检查
    results.environment = {
      nodeEnv: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL ?
        process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 20) + '...' : 'not-set',
    };

    // 6. 性能指标
    const endTime = Date.now();
    results.performance = {
      totalResponseTime: `${endTime - startTime}ms`,
      timestamp: new Date().toISOString()
    };

    // 7. 总结
    const allTests = Object.values(results.testResults);
    const successfulTests = allTests.filter((test: any) => test.success !== false);
    results.summary = {
      totalTests: allTests.length,
      successfulTests: successfulTests.length,
      failedTests: allTests.length - successfulTests.length,
      overallSuccess: successfulTests.length === allTests.length
    };

    return NextResponse.json(results);

  } catch (error) {
    const endTime = Date.now();

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined,
      performance: {
        totalResponseTime: `${endTime - startTime}ms`,
        timestamp: new Date().toISOString()
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      }
    }, { status: 500 });
  }
}

// 支持POST请求进行自定义hashtag提取测试
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoData, testMode = 'extraction-only' } = body;

    if (!videoData) {
      return NextResponse.json({
        success: false,
        error: '缺少videoData参数'
      }, { status: 400 });
    }

    const startTime = Date.now();
    const results: any = {};

    // Hashtag提取
    if (testMode === 'extraction-only' || testMode === 'full-test') {
      const extractionResult = extractHashtagsFromVideo(videoData);
      results.extraction = extractionResult;
    }

    // 创建hashtag和关联
    if (testMode === 'full-test') {
      const extractionResult = extractHashtagsFromVideo(videoData);

      // 创建hashtag
      const hashtagCreations = [];
      for (const hashtag of extractionResult.hashtags) {
        const createResult = await createHashtag(hashtag.name);
        hashtagCreations.push({
          hashtag,
          createResult
        });
      }

      // 创建关联（需要实际的hashtag ID）
      const hashtagRelations = extractionResult.hashtags.map((hashtag, index) => ({
        hashtagId: index + 1, // 临时ID，实际应该从创建结果中获取
        source: hashtag.source,
        position: hashtag.position,
        confidence: hashtag.confidence
      }));

      const relationResult = await createVideoHashtagRelations(
        videoData.id,
        hashtagRelations
      );

      results.databaseOperations = {
        hashtagCreations,
        relationResult
      };
    }

    const endTime = Date.now();

    return NextResponse.json({
      success: true,
      results,
      performance: {
        responseTime: `${endTime - startTime}ms`,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}