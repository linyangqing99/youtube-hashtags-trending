// 数据库连接测试脚本
// 用于验证表结构和基本功能

import { supabase, supabaseAdmin } from './supabase'

export interface TableInfo {
  tableName: string
  exists: boolean
  columns?: Array<{
    name: string
    type: string
    nullable: boolean
    default?: string
  }>
  indexes?: Array<{
    name: string
    columns: string[]
    unique: boolean
  }>
  error?: string
}

export interface TestResult {
  success: boolean
  connectionTest: {
    success: boolean
    message: string
    error?: any
  }
  tables: Record<string, TableInfo>
  summary: {
    totalTables: number
    successfulTables: number
    failedTables: number
  }
}

export async function testDatabaseSchema(): Promise<TestResult> {
  const result: TestResult = {
    success: true,
    connectionTest: { success: false, message: '' },
    tables: {},
    summary: { totalTables: 0, successfulTables: 0, failedTables: 0 }
  }

  // 首先测试基础连接
  try {
    const { data, error } = await supabase
      .from('hashtags')
      .select('count')
      .limit(1)

    if (error) {
      result.connectionTest = {
        success: false,
        message: '数据库连接失败',
        error: error
      }
      result.success = false
      return result
    }

    result.connectionTest = {
      success: true,
      message: '数据库连接成功'
    }
  } catch (err) {
    result.connectionTest = {
      success: false,
      message: '数据库连接异常',
      error: err
    }
    result.success = false
    return result
  }

  // 测试每个表的存在性和基本结构
  const tablesToTest = [
    'channels',
    'videos',
    'hashtags',
    'video_hashtags',
    'video_snapshots',
    'hashtag_trends',
    'api_queries',
    'user_subscriptions'
  ]

  for (const tableName of tablesToTest) {
    const tableInfo: TableInfo = {
      tableName,
      exists: false
    }

    try {
      // 测试表是否存在（通过尝试查询）
      const { data, error } = await supabaseAdmin
        .from(tableName)
        .select('*')
        .limit(0)

      if (error) {
        // 检查是否是权限错误还是表不存在错误
        if (error.code === '42P01') {
          tableInfo.error = `表 ${tableName} 不存在`
        } else {
          tableInfo.error = `查询表 ${tableName} 失败: ${error.message}`
        }
        result.tables[tableName] = tableInfo
        continue
      }

      tableInfo.exists = true

      // 尝试获取表结构信息
      try {
        // 使用 Postgres 系统表查询列信息
        const { data: columnsData, error: columnsError } = await supabaseAdmin
          .rpc('get_table_columns', { table_name: tableName })

        if (!columnsError && columnsData) {
          tableInfo.columns = columnsData.map((col: any) => ({
            name: col.column_name,
            type: col.data_type,
            nullable: col.is_nullable === 'YES',
            default: col.column_default
          }))
        }
      } catch (err) {
        // 如果无法获取列信息，仍然标记表存在
        console.warn(`无法获取表 ${tableName} 的列信息:`, err)
      }

      result.tables[tableName] = tableInfo
      result.summary.successfulTables++

    } catch (err) {
      tableInfo.error = err instanceof Error ? err.message : '未知错误'
      result.tables[tableName] = tableInfo
      result.summary.failedTables++
    }

    result.summary.totalTables++
  }

  // 如果有任何表测试失败，整体结果为失败
  result.success = result.summary.failedTables === 0 && result.connectionTest.success

  return result
}

// 测试时间序列表的基本功能
export async function testTimeSeriesFunctionality() {
  const results = {
    videoSnapshots: { success: false, message: '', error: null as any },
    hashtagTrends: { success: false, message: '', error: null as any }
  }

  try {
    // 测试 video_snapshots 表
    const testVideoId = 'test_video_' + Date.now()
    const testSnapshot = {
      video_id: testVideoId,
      view_count: 100,
      like_count: 10,
      comment_count: 5,
      snapshot_date: new Date().toISOString(),
      ranking_position: 1
    }

    const { data: snapshotData, error: snapshotError } = await supabaseAdmin
      .from('video_snapshots')
      .insert(testSnapshot)
      .select()
      .single()

    if (snapshotError) {
      results.videoSnapshots = {
        success: false,
        message: '插入 video_snapshots 测试记录失败',
        error: snapshotError
      }
    } else {
      results.videoSnapshots = {
        success: true,
        message: 'video_snapshots 表功能正常'
      }

      // 清理测试数据
      await supabaseAdmin
        .from('video_snapshots')
        .delete()
        .eq('video_id', testVideoId)
    }
  } catch (err) {
    results.videoSnapshots = {
      success: false,
      message: 'video_snapshots 测试异常',
      error: err
    }
  }

  try {
    // 测试 hashtag_trends 表
    const testHashtagId = '00000000-0000-0000-0000-000000000000' // 使用一个标准UUID
    const testTrend = {
      hashtag_id: testHashtagId,
      mention_count: 50,
      unique_videos: 25,
      total_views: 10000,
      avg_views_per_video: 400,
      trend_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      region_code: 'US',
      ranking_position: 5
    }

    const { data: trendData, error: trendError } = await supabaseAdmin
      .from('hashtag_trends')
      .insert(testTrend)
      .select()
      .single()

    if (trendError) {
      results.hashtagTrends = {
        success: false,
        message: '插入 hashtag_trends 测试记录失败',
        error: trendError
      }
    } else {
      results.hashtagTrends = {
        success: true,
        message: 'hashtag_trends 表功能正常'
      }

      // 清理测试数据
      await supabaseAdmin
        .from('hashtag_trends')
        .delete()
        .eq('hashtag_id', testHashtagId)
        .eq('trend_date', testTrend.trend_date)
    }
  } catch (err) {
    results.hashtagTrends = {
      success: false,
      message: 'hashtag_trends 测试异常',
      error: err
    }
  }

  return {
    success: results.videoSnapshots.success && results.hashtagTrends.success,
    results
  }
}

// 格式化测试结果为可读的字符串
export function formatTestResults(testResult: TestResult): string {
  let output = '=== Supabase 数据库结构测试结果 ===\n\n'

  // 连接测试结果
  output += `🔗 数据库连接: ${testResult.connectionTest.success ? '✅ 成功' : '❌ 失败'}\n`
  output += `   ${testResult.connectionTest.message}\n`
  if (testResult.connectionTest.error) {
    output += `   错误详情: ${JSON.stringify(testResult.connectionTest.error, null, 2)}\n`
  }
  output += '\n'

  // 表测试结果
  output += `📊 表结构测试 (${testResult.summary.successfulTables}/${testResult.summary.totalTables} 通过)\n\n`

  for (const [tableName, tableInfo] of Object.entries(testResult.tables)) {
    const status = tableInfo.exists ? '✅' : '❌'
    output += `${status} ${tableName}\n`

    if (tableInfo.exists) {
      if (tableInfo.columns && tableInfo.columns.length > 0) {
        output += `   列数: ${tableInfo.columns.length}\n`
        // 显示前3列作为示例
        const sampleColumns = tableInfo.columns.slice(0, 3)
        sampleColumns.forEach(col => {
          output += `   - ${col.name}: ${col.type}${col.nullable ? ' (nullable)' : ''}\n`
        })
        if (tableInfo.columns.length > 3) {
          output += `   ... 还有 ${tableInfo.columns.length - 3} 列\n`
        }
      }
    } else {
      output += `   ❌ ${tableInfo.error}\n`
    }
    output += '\n'
  }

  // 总体结果
  const overallStatus = testResult.success ? '✅ 全部通过' : '❌ 存在问题'
  output += `🎯 总体结果: ${overallStatus}\n`

  return output
}

// 运行完整测试的主函数
export async function runFullDatabaseTest() {
  console.log('开始数据库测试...')

  const schemaResult = await testDatabaseSchema()
  console.log(formatTestResults(schemaResult))

  if (schemaResult.success) {
    console.log('\n🧪 测试时间序列表功能...')
    const timeSeriesResult = await testTimeSeriesFunctionality()

    if (timeSeriesResult.success) {
      console.log('✅ 时间序列表功能测试通过')
    } else {
      console.log('❌ 时间序列表功能测试失败')
      console.log('video_snapshots:', timeSeriesResult.results.videoSnapshots)
      console.log('hashtag_trends:', timeSeriesResult.results.hashtagTrends)
    }
  }

  return schemaResult
}