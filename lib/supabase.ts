// Supabase客户端配置
import { createClient } from '@supabase/supabase-js'
import { Database } from './supabase-types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// 验证必需的环境变量
if (!supabaseUrl) {
  throw new Error('Missing Supabase URL. Please set NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL environment variable.')
}

if (!supabaseAnonKey) {
  throw new Error('Missing Supabase Anon Key. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY environment variable.')
}

// 创建客户端（用于前端和普通API调用）
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
})

// 创建服务端客户端（用于敏感操作，需要服务角色密钥）
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: 'public',
  },
})

// 数据库连接测试函数
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('hashtags')
      .select('count')
      .limit(1)

    if (error) {
      console.error('Supabase连接测试失败:', error)
      return {
        success: false,
        error: error.message,
        details: error
      }
    }

    return {
      success: true,
      message: 'Supabase连接成功',
      data
    }
  } catch (err) {
    console.error('Supabase连接异常:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : '未知错误',
      details: err
    }
  }
}

// 创建新hashtag函数
export async function createHashtag(name: string) {
  try {
    const normalizedName = name.toLowerCase().replace(/^#/, '').trim()

    const { data, error } = await supabase
      .from('hashtags' as any)
      .upsert<any>({
        name: normalizedName,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'name',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) {
      // 如果是重复记录，获取现有记录
      if (error.code === '23505') {
        const { data: existing } = await supabase
          .from('hashtags')
          .select()
          .eq('name', normalizedName)
          .single()

        return {
          success: true,
          data: existing,
          isExisting: true
        }
      }

      throw error
    }

    return {
      success: true,
      data,
      isExisting: false
    }
  } catch (error) {
    console.error('创建hashtag失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '创建hashtag失败'
    }
  }
}

// 批量创建视频hashtag关联
export async function createVideoHashtagRelations(
  videoId: string,
  hashtagRelations: { hashtagId: number; source: 'title' | 'description' | 'tags' | 'extracted'; position?: number; confidence?: number }[]
) {
  try {
    const relations = hashtagRelations.map(relation => ({
      video_id: videoId,
      hashtag_id: relation.hashtagId,
      source: relation.source,
      position: relation.position || null,
      confidence_score: relation.confidence || 1.0,
      created_at: new Date().toISOString()
    }))

    const { data, error } = await supabase
      .from('video_hashtags')
      .upsert(relations, {
        onConflict: 'video_id,hashtag_id,source',
        ignoreDuplicates: true
      })
      .select()

    if (error) {
      throw error
    }

    return {
      success: true,
      data,
      insertedCount: data.length
    }
  } catch (error) {
    console.error('创建视频hashtag关联失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '创建视频hashtag关联失败'
    }
  }
}

// 创建或更新视频数据
export async function upsertVideo(videoData: Database['public']['Tables']['videos']['Insert']) {
  try {
    const { data, error } = await supabase
      .from('videos')
      .upsert({
        ...videoData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return {
      success: true,
      data,
      isUpdate: !!data.updated_at && data.updated_at !== videoData.created_at
    }
  } catch (error) {
    console.error('创建/更新视频失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '创建/更新视频失败'
    }
  }
}

// 创建视频快照
export async function createVideoSnapshot(snapshotData: Database['public']['Tables']['video_snapshots']['Insert']) {
  try {
    const { data, error } = await supabase
      .from('video_snapshots')
      .upsert({
        ...snapshotData,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'video_id,snapshot_date',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return {
      success: true,
      data,
      isUpdate: !!data.created_at
    }
  } catch (error) {
    console.error('创建视频快照失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '创建视频快照失败'
    }
  }
}

// 记录API查询
export async function recordApiQuery(queryData: Database['public']['Tables']['api_queries']['Insert']) {
  try {
    const { data, error } = await supabase
      .from('api_queries')
      .insert({
        ...queryData,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('记录API查询失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '记录API查询失败'
    }
  }
}

export default supabase
