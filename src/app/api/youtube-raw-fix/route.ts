/**
 * YouTube API 原始数据测试接口 - 安全版（使用 fetch，避免 shell 注入）
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3'

if (!YOUTUBE_API_KEY) {
  throw new Error('YouTube API密钥未配置，请设置 YOUTUBE_API_KEY 环境变量')
}

// Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// 简化的hashtag提取函数
function extractHashtags(text: string): string[] {
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g
  const matches = Array.from(text.matchAll(hashtagRegex))
  return matches.map((match) => match[1].toLowerCase())
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const searchParams = request.nextUrl.searchParams
    const regionCode = searchParams.get('regionCode') || 'US'
    const maxResults = parseInt(searchParams.get('maxResults') || '5')
    const pageToken = searchParams.get('pageToken') || undefined
    const saveToDb = searchParams.get('saveToDb') === 'true'

    // 构建安全 URL
    const url = new URL(`${YOUTUBE_API_BASE_URL}/videos`)
    url.searchParams.set('part', 'snippet,statistics')
    url.searchParams.set('chart', 'mostPopular')
    url.searchParams.set('regionCode', regionCode)
    url.searchParams.set('maxResults', String(maxResults))
    url.searchParams.set('key', YOUTUBE_API_KEY)
    if (pageToken) url.searchParams.set('pageToken', pageToken)

    const fetchResponse = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })

    const responseTime = Date.now() - startTime

    if (!fetchResponse.ok) {
      const text = await fetchResponse.text()
      throw new Error(`YouTube API 请求失败: ${fetchResponse.status} ${fetchResponse.statusText} - ${text}`)
    }

    const responseData = await fetchResponse.json()

    // 数据入库逻辑
    let dbResults = { savedVideos: 0, savedHashtags: 0, savedRelations: 0, errors: [] as string[] }

    if (saveToDb && supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)

      for (const item of responseData.items || []) {
        try {
          // 1. 插入或更新视频数据
          const videoData = {
            id: item.id,
            title: item.snippet?.title || '',
            description: item.snippet?.description || '',
            channel_title: item.snippet?.channelTitle || '',
            view_count: parseInt(item.statistics?.viewCount || '0'),
            like_count: parseInt(item.statistics?.likeCount || '0'),
            comment_count: parseInt(item.statistics?.commentCount || '0'),
            published_at: item.snippet?.publishedAt || null,
            tags: item.snippet?.tags || [],
          }

          const { error: videoError } = await supabase.from('videos').upsert(videoData, { onConflict: 'id' })
          if (videoError) {
            dbResults.errors.push(`视频保存失败 (${item.id}): ${videoError.message}`)
            continue
          }
          dbResults.savedVideos++

          // 2. 提取hashtag
          const titleHashtags = extractHashtags(videoData.title)
          const descriptionHashtags = extractHashtags(videoData.description)
          const allHashtags = [...new Set([...titleHashtags, ...descriptionHashtags])]

          // 3. 插入hashtag并创建关联
          for (const hashtagName of allHashtags) {
            if (hashtagName.length < 2 || hashtagName.length > 50) continue

            const { data: hashtagResult, error: hashtagError } = await supabase
              .from('hashtags')
              .upsert({ name: hashtagName }, { onConflict: 'name' })
              .select()
              .single()

            if (hashtagError || !hashtagResult) {
              dbResults.errors.push(`Hashtag保存失败 (${hashtagName}): ${hashtagError?.message || '未知错误'}`)
              continue
            }
            dbResults.savedHashtags++

            const source = titleHashtags.includes(hashtagName) ? 'title' : 'description'
            const { error: relationError } = await supabase
              .from('video_hashtags')
              .upsert(
                {
                  video_id: item.id,
                  hashtag_id: hashtagResult.id,
                  source,
                },
                { onConflict: 'video_id,hashtag_id' }
              )

            if (relationError) {
              dbResults.errors.push(`关联保存失败 (${item.id}-${hashtagName}): ${relationError.message}`)
            } else {
              dbResults.savedRelations++
            }
          }
        } catch (itemError: any) {
          dbResults.errors.push(`处理视频失败 (${item?.id || 'unknown'}): ${itemError.message || '未知错误'}`)
        }
      }
    }

    const responseStats = {
      itemCount: responseData.items?.length || 0,
      hasTags:
        responseData.items?.some((item: any) => item.snippet?.tags && item.snippet.tags.length > 0) || false,
      totalTags:
        responseData.items?.reduce((total: number, item: any) => total + (item.snippet?.tags?.length || 0), 0) || 0,
    }

    return NextResponse.json({
      success: true,
      request: {
        url: url.toString(),
        method: 'GET',
        params: {
          part: 'snippet,statistics',
          chart: 'mostPopular',
          regionCode,
          maxResults,
          pageToken,
          saveToDb,
          key: YOUTUBE_API_KEY.substring(0, 10) + '...',
        },
      },
      response: {
        data: responseData,
        stats: responseStats,
      },
      database: saveToDb ? dbResults : null,
      performance: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        method: 'fetch',
      },
    })
  } catch (error: any) {
    const responseTime = Date.now() - startTime
    return NextResponse.json(
      {
        success: false,
        error: error?.message || '未知错误',
        performance: {
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString(),
          method: 'fetch',
        },
      },
      { status: 500 }
    )
  }
}
