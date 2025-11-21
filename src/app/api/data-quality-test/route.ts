/**
 * 数据质量和完整性测试接口
 * 使用示例数据测试 hashtag 提取算法和数据质量
 */

import { NextRequest, NextResponse } from 'next/server';
import { hashtagExtractor } from '@/lib/hashtag-extractor';

// 模拟的多页示例数据
const generateMockPages = (pageCount: number, itemsPerPage: number) => {
  const mockPages = [];

  // 基础示例数据模板
  const baseVideoTemplates = [
    {
      kind: "youtube#video",
      etag: "mock-etag-1",
      id: "demo-video-1",
      snippet: {
        publishedAt: "2025-11-18T10:00:00Z",
        channelId: "UC1234567890",
        title: "Amazing Gaming Moments #gaming #wow #epic",
        description: "Check out these incredible gaming moments! #gaming #gamer #gameplay #videogames #trending #viral",
        thumbnails: {
          default: { url: "", width: 120, height: 90 },
          medium: { url: "", width: 320, height: 180 },
          high: { url: "", width: 480, height: 360 },
        },
        channelTitle: "Gaming Channel",
        tags: ["gaming", "gamer", "gameplay", "videogames", "epic", "amazing"],
        categoryId: "20",
        liveBroadcastContent: "none",
        defaultLanguage: "en",
        localized: {
          title: "Amazing Gaming Moments #gaming #wow #epic",
          description: "Check out these incredible gaming moments! #gaming #gamer #gameplay #videogames #trending #viral"
        },
        defaultAudioLanguage: "en"
      },
      statistics: {
        viewCount: "100000",
        likeCount: "5000",
        favoriteCount: "0",
        commentCount: "200"
      }
    },
    {
      kind: "youtube#video",
      etag: "mock-etag-2",
      id: "demo-video-2",
      snippet: {
        publishedAt: "2025-11-17T15:30:00Z",
        channelId: "UC0987654321",
        title: "Music Production Tutorial #music #producer #flstudio",
        description: "Learn music production in FL Studio #music #producer #flstudio #tutorial #edm #beatmaking",
        thumbnails: {
          default: { url: "", width: 120, height: 90 },
          medium: { url: "", width: 320, height: 180 },
          high: { url: "", width: 480, height: 360 },
        },
        channelTitle: "Music Producer",
        tags: ["music", "producer", "flstudio", "tutorial", "edm", "beatmaking", "musicproduction"],
        categoryId: "10",
        liveBroadcastContent: "none",
        defaultLanguage: "en",
        localized: {
          title: "Music Production Tutorial #music #producer #flstudio",
          description: "Learn music production in FL Studio #music #producer #flstudio #tutorial #edm #beatmaking"
        },
        defaultAudioLanguage: "en"
      },
      statistics: {
        viewCount: "75000",
        likeCount: "3500",
        favoriteCount: "0",
        commentCount: "150"
      }
    },
    {
      kind: "youtube#video",
      etag: "mock-etag-3",
      id: "demo-video-3",
      snippet: {
        publishedAt: "2025-11-16T20:15:00Z",
        channelId: "UC1122334455",
        title: "Cooking Masterclass: Italian Pasta #cooking #food #pasta",
        description: "Master the art of Italian pasta making #cooking #food #pasta #italian #recipe #chef",
        thumbnails: {
          default: { url: "", width: 120, height: 90 },
          medium: { url: "", width: 320, height: 180 },
          high: { url: "", width: 480, height: 360 },
        },
        channelTitle: "Cooking Show",
        tags: ["cooking", "food", "pasta", "italian", "recipe", "chef", "culinary"],
        categoryId: "22",
        liveBroadcastContent: "none",
        defaultLanguage: "en",
        localized: {
          title: "Cooking Masterclass: Italian Pasta #cooking #food #pasta",
          description: "Master the art of Italian pasta making #cooking #food #pasta #italian #recipe #chef"
        },
        defaultAudioLanguage: "en"
      },
      statistics: {
        viewCount: "50000",
        likeCount: "2500",
        favoriteCount: "0",
        commentCount: "100"
      }
    }
  ];

  for (let page = 0; page < pageCount; page++) {
    const pageItems = [];
    const startIdx = page * itemsPerPage;

    for (let i = 0; i < itemsPerPage; i++) {
      const templateIndex = (startIdx + i) % baseVideoTemplates.length;
      const template = baseVideoTemplates[templateIndex];

      // 创建变体
      const variant = JSON.parse(JSON.stringify(template));
      variant.id = `${variant.id}-page${page + 1}-item${i + 1}`;
      variant.etag = `${variant.etag}-page${page + 1}-item${i + 1}`;

      // 添加时间变化
      const dateOffset = page * 24 * 60 * 60 * 1000; // 每页间隔一天
      const baseDate = new Date("2025-11-18T10:00:00Z");
      baseDate.setTime(baseDate.getTime() - dateOffset - (i * 60 * 60 * 1000)); // 每个视频间隔1小时
      variant.snippet.publishedAt = baseDate.toISOString();

      // 添加一些变化的数据
      variant.statistics.viewCount = String(Math.floor(Math.random() * 200000) + 10000);
      variant.statistics.likeCount = String(Math.floor(Math.random() * 10000) + 1000);
      variant.statistics.commentCount = String(Math.floor(Math.random() * 1000) + 50);

      pageItems.push(variant);
    }

    mockPages.push({
      pageInfo: {
        totalResults: pageCount * itemsPerPage,
        resultsPerPage: itemsPerPage
      },
      items: pageItems,
      nextPageToken: page < pageCount - 1 ? `page-token-${page + 2}` : undefined,
      prevPageToken: page > 0 ? `page-token-${page}` : undefined
    });
  }

  return mockPages;
};

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const pageCount = Math.min(parseInt(searchParams.get('pageCount') || '3'), 10); // 最多10页
    const itemsPerPage = Math.min(parseInt(searchParams.get('itemsPerPage') || '5'), 50); // 每页最多50个

    console.log(`开始数据质量测试: ${pageCount}页，每页${itemsPerPage}个视频`);

    // 生成模拟多页数据
    const mockPages = generateMockPages(pageCount, itemsPerPage);

    // 合并所有页面数据进行 hashtag 分析
    const allVideos = mockPages.flatMap(page => page.items);

    // 提取 hashtag
    const hashtagResult = hashtagExtractor.extractHashtagsFromVideos(allVideos);

    // 生成热力图数据
    const heatmapData = hashtagExtractor.generateHeatmapData(hashtagResult.hashtags, 7);

    // 数据质量分析
    const dataQualityAnalysis = {
      videoAnalysis: {
        totalVideos: allVideos.length,
        videosWithTags: allVideos.filter(v => v.snippet.tags && v.snippet.tags.length > 0).length,
        averageTagsPerVideo: allVideos.reduce((sum, v) => sum + (v.snippet.tags?.length || 0), 0) / allVideos.length,
        videosWithHashtagsInText: allVideos.filter(v => {
          const text = `${v.snippet.title} ${v.snippet.description}`;
          return /#([a-zA-Z0-9_]+)/.test(text);
        }).length,
      },
      hashtagAnalysis: {
        totalUniqueHashtags: hashtagResult.hashtags.length,
        averageMentionsPerHashtag: hashtagResult.totalHashtags > 0 ?
          hashtagResult.hashtags.reduce((sum, h) => sum + h.mentions, 0) / hashtagResult.hashtags.length : 0,
        topHashtags: hashtagResult.topHashtags.slice(0, 10),
        hashtagDistribution: {
          singleMention: hashtagResult.hashtags.filter(h => h.mentions === 1).length,
          multipleMentions: hashtagResult.hashtags.filter(h => h.mentions > 1).length,
          highFrequency: hashtagResult.hashtags.filter(h => h.mentions >= 5).length,
        }
      },
      contentQuality: {
        dateRange: {
          earliest: allVideos.reduce((earliest, v) =>
            v.snippet.publishedAt < earliest ? v.snippet.publishedAt : earliest,
            allVideos[0]?.snippet.publishedAt
          ),
          latest: allVideos.reduce((latest, v) =>
            v.snippet.publishedAt > latest ? v.snippet.publishedAt : latest,
            allVideos[0]?.snippet.publishedAt
          ),
        },
        channelDiversity: new Set(allVideos.map(v => v.snippet.channelTitle)).size,
        categoryDistribution: allVideos.reduce((dist, v) => {
          const cat = v.snippet.categoryId;
          dist[cat] = (dist[cat] || 0) + 1;
          return dist;
        }, {} as Record<string, number>),
      }
    };

    // 分页测试结果
    const paginationTest = {
      requestedPages: pageCount,
      successfulPages: mockPages.length,
      totalVideosRetrieved: allVideos.length,
      expectedVideos: pageCount * itemsPerPage,
      paginationTokens: mockPages.map((page, index) => ({
        pageNum: index + 1,
        hasPrevToken: !!page.prevPageToken,
        hasNextToken: !!page.nextPageToken,
      }))
    };

    // 热力图样本数据
    const heatmapSample = Array.from(heatmapData.entries())
      .slice(0, 5)
      .map(([tag, dateMap]) => ({
        tag,
        dailyData: Object.fromEntries(dateMap.entries()),
        totalMentions: Array.from(dateMap.values()).reduce((sum, count) => sum + count, 0)
      }));

    const endTime = Date.now();

    return NextResponse.json({
      success: true,
      request: {
        pageCount,
        itemsPerPage,
        totalExpectedVideos: pageCount * itemsPerPage,
      },
      results: {
        pagination: paginationTest,
        hashtagAnalysis: hashtagResult,
        dataQuality: dataQualityAnalysis,
        heatmap: {
          generatedFor: 7,
          sampleData: heatmapSample,
          totalHashtagsWithHeatmap: heatmapData.size,
        }
      },
      performance: {
        processingTime: `${endTime - startTime}ms`,
        videosProcessed: allVideos.length,
        hashtagsExtracted: hashtagResult.totalHashtags,
        averageProcessingTimePerVideo: `${Math.round((endTime - startTime) / allVideos.length)}ms`,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        testType: 'data-quality-mock',
        dataSource: 'generated-mock-data',
        note: '此测试使用模拟数据验证数据质量和算法逻辑'
      }
    });

  } catch (error) {
    const endTime = Date.now();

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      performance: {
        processingTime: `${endTime - startTime}ms`,
        timestamp: new Date().toISOString(),
      },
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}