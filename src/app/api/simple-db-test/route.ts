/**
 * 简化版数据库测试API
 * 专门针对3个表的结构进行测试
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 简化的Supabase客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('缺少Supabase配置');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 示例视频数据
const sampleVideo = {
  id: 'test-video-123',
  title: 'Amazing #JavaScript Tutorial for #beginners',
  description: 'Learn #JavaScript and #coding in this amazing tutorial! #programming',
  channel_title: 'Test Channel',
  view_count: 10000,
  like_count: 500,
  comment_count: 50,
  published_at: '2025-11-20T10:00:00Z',
  tags: ['JavaScript', 'Tutorial', 'Programming']
};

// 简单的hashtag提取函数
function extractHashtags(text: string): string[] {
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  const matches = Array.from(text.matchAll(hashtagRegex));
  return matches.map(match => match[1].toLowerCase());
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const testType = searchParams.get('test') || 'all';

  try {
    const results: any = {
      success: true,
      timestamp: new Date().toISOString(),
      testResults: {}
    };

    // 1. 测试数据库连接
    if (testType === 'all' || testType === 'connection') {
      console.log('测试数据库连接...');

      const { data, error } = await supabase
        .from('hashtags')
        .select('count')
        .limit(1);

      results.testResults.connection = {
        success: !error,
        message: error ? error.message : '数据库连接成功',
        data
      };
    }

    // 2. 测试hashtag提取
    if (testType === 'all' || testType === 'extraction') {
      console.log('测试hashtag提取...');

      const titleHashtags = extractHashtags(sampleVideo.title);
      const descriptionHashtags = extractHashtags(sampleVideo.description);
      const nativeTags = sampleVideo.tags.map(tag => tag.toLowerCase());

      const allHashtags: string[] = [];
      const seen = new Set<string>();
      for (const tag of [...titleHashtags, ...descriptionHashtags, ...nativeTags]) {
        if (!seen.has(tag)) {
          seen.add(tag);
          allHashtags.push(tag);
        }
      }

      results.testResults.extraction = {
        videoTitle: sampleVideo.title,
        videoDescription: sampleVideo.description,
        titleHashtags,
        descriptionHashtags,
        nativeTags,
        uniqueHashtags: allHashtags,
        totalExtracted: allHashtags.length
      };
    }

    // 3. 测试数据插入
    if (testType === 'all' || testType === 'insert') {
      console.log('测试数据插入...');

      // 先插入视频
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .upsert(sampleVideo, {
          onConflict: 'id'
        })
        .select()
        .single();

      results.testResults.videoInsert = {
        success: !videoError,
        message: videoError ? videoError.message : '视频插入成功',
        data: videoData
      };

      if (!videoError) {
        // 提取并插入hashtag
        const titleHashtags = extractHashtags(sampleVideo.title);
        const descriptionHashtags = extractHashtags(sampleVideo.description);
        const allHashtags: string[] = [];
        const seenHashtags = new Set<string>();
        for (const tag of [...titleHashtags, ...descriptionHashtags]) {
          if (!seenHashtags.has(tag)) {
            seenHashtags.add(tag);
            allHashtags.push(tag);
          }
        }

        const hashtagInserts = [];
        for (const hashtagName of allHashtags) {
          const { data: hashtagData, error: hashtagError } = await supabase
            .from('hashtags')
            .upsert({
              name: hashtagName,
              count: 1
            }, {
              onConflict: 'name',
              ignoreDuplicates: false
            })
            .select()
            .single();

          if (!hashtagError) {
            hashtagInserts.push(hashtagData);
          }
        }

        results.testResults.hashtagInserts = {
          success: hashtagInserts.length > 0,
          insertedCount: hashtagInserts.length,
          hashtags: hashtagInserts
        };
      }
    }

    // 4. 测试数据查询
    if (testType === 'all' || testType === 'query') {
      console.log('测试数据查询...');

      // 查询所有视频
      const { data: videos, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .limit(5);

      // 查询热门hashtag
      const { data: hashtags, error: hashtagsError } = await supabase
        .from('hashtags')
        .select('*')
        .order('count', { ascending: false })
        .limit(10);

      results.testResults.query = {
        videos: {
          success: !videosError,
          data: videos,
          count: videos?.length || 0,
          error: videosError?.message
        },
        hashtags: {
          success: !hashtagsError,
          data: hashtags,
          count: hashtags?.length || 0,
          error: hashtagsError?.message
        }
      };
    }

    // 环境信息
    results.environment = {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      urlPrefix: supabaseUrl.substring(0, 30) + '...'
    };

    // 性能信息
    const endTime = Date.now();
    results.performance = {
      responseTime: `${endTime - startTime}ms`,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(results);

  } catch (error) {
    const endTime = Date.now();

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined,
      performance: {
        responseTime: `${endTime - startTime}ms`,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
