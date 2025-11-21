/**
 * YouTube API 测试接口
 * 用于测试 YouTube API 连接和 hashtag 提取功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { youtubeClient } from '@/lib/youtube-api';
import { hashtagExtractor } from '@/lib/hashtag-extractor';

export async function GET() {
  try {
    console.log('开始测试 YouTube API 连接...');

    // 1. 测试 API 连接
    const isConnected = await youtubeClient.testConnection();

    if (!isConnected) {
      // 如果 API 连接失败，使用示例数据进行测试
      console.log('API 连接失败，使用示例数据进行测试...');

      // 使用您提供的示例数据创建测试数据
      const sampleData = {
        items: [
          {
            kind: "youtube#video",
            etag: "00XfkOHzdjA8uhDWrW9Rl3KdHrI",
            id: "ZiyE33pWdU4",
            snippet: {
              publishedAt: "2025-11-11T23:32:15Z",
              channelId: "UCkFbAywlXz4W0BCle2eFyUw",
              title: "Toy Story 5 Teaser, Mario Galaxy Movie Leak, New DCU Show & MORE!!",
              description: "#gaming #movies #trailers Today On Side Flick We Discuss Topics\n0:00 Intro\n0:40 Mario Galaxy Movie Leak\n3:18 V For Vendetta Show Announced\n#marvel #dc #comics 4:36 Jimmy Olsen DCU TV Show Announced \n7:23 Toy Story 5 Teaser Trailer\n#pixar #animation #toystory",
              thumbnails: {
                default: { url: "", width: 120, height: 90 },
                medium: { url: "", width: 320, height: 180 },
                high: { url: "", width: 480, height: 360 },
              },
              channelTitle: "3C Films",
              tags: ["movies", "trailers", "gaming", "marvel", "dc", "comics", "pixar", "animation"],
              categoryId: "24",
              liveBroadcastContent: "none",
              defaultLanguage: "en",
              localized: {
                title: "Toy Story 5 Teaser, Mario Galaxy Movie Leak, New DCU Show & MORE!!",
                description: "#gaming #movies #trailers Today On Side Flick We Discuss Topics\n0:00 Intro\n0:40 Mario Galaxy Movie Leak\n3:18 V For Vendetta Show Announced\n#marvel #dc #comics 4:36 Jimmy Olsen DCU TV Show Announced \n7:23 Toy Story 5 Teaser Trailer\n#pixar #animation #toystory"
              },
              defaultAudioLanguage: "en"
            },
            statistics: {
              viewCount: "66487",
              likeCount: "4461",
              favoriteCount: "0",
              commentCount: "505"
            }
          },
          {
            kind: "youtube#video",
            etag: "oUy0JrVVrZAg0orr3V1J4r2qR6Q",
            id: "-hs7hBfLFEk",
            snippet: {
              publishedAt: "2025-11-12T00:40:15Z",
              channelId: "UCxsk7hqE_CwZWGEJEkGanbA",
              title: "Steal a Brainrot Admin Abuse (Taco Tuesday)",
              description: "roblox #gaming #live #roblox steal a brainrot admin abuse (taco tuesday) live\n#shorts #gaming #roblox #live",
              thumbnails: {
                default: { url: "", width: 120, height: 90 },
                medium: { url: "", width: 320, height: 180 },
                high: { url: "", width: 480, height: 360 },
              },
              channelTitle: "KreekCraft",
              tags: ["roblox", "gaming", "live", "shorts", "brainrot"],
              categoryId: "20",
              liveBroadcastContent: "none",
              defaultLanguage: "en-US",
              localized: {
                title: "Steal a Brainrot Admin Abuse (Taco Tuesday)",
                description: "roblox #gaming #live #roblox steal a brainrot admin abuse (taco tuesday) live\n#shorts #gaming #roblox #live"
              },
              defaultAudioLanguage: "en-US"
            },
            statistics: {
              viewCount: "3120641",
              likeCount: "33159",
              favoriteCount: "0",
              commentCount: "88"
            }
          },
          {
            kind: "youtube#video",
            etag: "rKmLyv8KIEZJTzYrtGB9suVN4ZM",
            id: "fmONdSPfCXc",
            snippet: {
              publishedAt: "2025-11-11T17:01:10Z",
              channelId: "UC69yJGpLNIMk6_ECLwxBZwA",
              title: "Creedence Clearwater Revival - Fortunate Son (Fan Celebration Version)",
              description: "Thank you for supporting CCR! #music #rock #classicrock #ccr #creedenceclearwaterrevival #fortunateson #live #concert",
              thumbnails: {
                default: { url: "", width: 120, height: 90 },
                medium: { url: "", width: 320, height: 180 },
                high: { url: "", width: 480, height: 360 },
              },
              channelTitle: "Creedence Clearwater Revival",
              tags: ["music", "rock", "classicrock", "ccr", "creedenceclearwaterrevival", "fortunateson", "live", "concert"],
              categoryId: "10",
              liveBroadcastContent: "none",
              defaultLanguage: "en",
              localized: {
                title: "Creedence Clearwater Revival - Fortunate Son (Fan Celebration Version)",
                description: "Thank you for supporting CCR! #music #rock #classicrock #ccr #creedenceclearwaterrevival #fortunateson #live #concert"
              },
              defaultAudioLanguage: "en"
            },
            statistics: {
              viewCount: "111064",
              likeCount: "1003",
              favoriteCount: "0",
              commentCount: "49"
            }
          }
        ]
      };

      // 2. 提取 hashtag
      const hashtagResult = hashtagExtractor.extractHashtagsFromVideos(sampleData.items);

      // 3. 生成热力图数据
      const heatmapData = hashtagExtractor.generateHeatmapData(hashtagResult.hashtags, 7);

      return NextResponse.json({
        success: true,
        message: '使用示例数据进行测试',
        data: {
          apiConnection: false,
          videosProcessed: hashtagResult.totalVideos,
          hashtagsFound: hashtagResult.totalHashtags,
          topHashtags: hashtagResult.topHashtags.slice(0, 5).map(h => ({
            tag: h.tag,
            mentions: h.mentions,
            videos: h.videos.length,
          })),
          heatmapSample: Object.fromEntries(
            Array.from(heatmapData.entries()).slice(0, 3).map(([tag, dateMap]) => [
              tag,
              Object.fromEntries(dateMap.entries())
            ])
          ),
          generatedAt: hashtagResult.generatedAt
        }
      });
    }

    // 如果 API 连接成功，获取真实数据
    console.log('API 连接成功，获取真实数据...');
    const videos = await youtubeClient.getPopularVideos('US', 10);

    // 提取 hashtag
    const hashtagResult = hashtagExtractor.extractHashtagsFromVideos(videos.items);

    return NextResponse.json({
      success: true,
      message: 'API 连接测试成功',
      data: {
        apiConnection: true,
        videosProcessed: hashtagResult.totalVideos,
        hashtagsFound: hashtagResult.totalHashtags,
        topHashtags: hashtagResult.topHashtags.slice(0, 5).map(h => ({
          tag: h.tag,
          mentions: h.mentions,
          videos: h.videos.length,
        })),
        generatedAt: hashtagResult.generatedAt
      }
    });

  } catch (error) {
    console.error('测试接口错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      message: 'API 测试失败，请检查配置或使用示例数据'
    }, { status: 500 });
  }
}