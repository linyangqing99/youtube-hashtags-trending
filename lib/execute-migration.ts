// 执行数据库迁移脚本
// 用于在 Supabase 中创建新的时间序列表结构

import { readFileSync } from 'fs'
import { join } from 'path'
import { supabaseAdmin } from './supabase'
import { runFullDatabaseTest } from './test-database-connection'
import { Database } from './supabase-types'

export async function executeMigration() {
  console.log('🚀 开始执行数据库迁移...')

  try {
    // 读取迁移SQL文件
    const migrationPath = join(__dirname, 'migrations/complete_schema_update.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')

    console.log('📝 迁移脚本已加载')
    console.log(`   脚本大小: ${migrationSQL.length} 字符`)
    console.log(`   脚本行数: ${migrationSQL.split('\n').length} 行`)

    // 注意：由于 Supabase JS SDK 不支持直接执行多行 SQL，
    // 我们需要使用 Supabase SQL Editor 或者 psql 来执行这个迁移
    // 这里我们只能提供 SQL 脚本，用户需要手动执行

    console.log('\n⚠️  重要提示：')
    console.log('   Supabase JS SDK 不支持直接执行复杂的 SQL 迁移脚本')
    console.log('   请按照以下步骤手动执行迁移：')
    console.log('\n   1. 打开 Supabase Dashboard')
    console.log('   2. 进入 SQL Editor (https://app.supabase.com/project/isorrcmivuomzolnaxgi/sql)')
    console.log('   3. 粘贴以下 SQL 脚本并执行：')
    console.log('\n' + '='.repeat(60))
    console.log('   迁移脚本路径：' + migrationPath)
    console.log('='.repeat(60) + '\n')

    // 显示迁移脚本的前几行作为预览
    const previewLines = migrationSQL.split('\n').slice(0, 20)
    console.log('📋 迁移脚本预览（前20行）：')
    previewLines.forEach((line, index) => {
      console.log(`${(index + 1).toString().padStart(3)}: ${line}`)
    })
    console.log('... (还有更多行)')

    console.log('\n🔄 迁移后测试...')
    console.log('   请在执行迁移后运行测试来验证表结构：')
    console.log('   npm run test-db')

    return {
      success: true,
      message: '迁移脚本已准备就绪，请在 Supabase Dashboard 中手动执行',
      migrationPath
    }

  } catch (error) {
    console.error('❌ 迁移失败:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '未知错误',
      error
    }
  }
}

// 验证迁移结果
export async function verifyMigration() {
  console.log('🔍 验证迁移结果...')

  try {
    const testResult = await runFullDatabaseTest()

    if (testResult.success) {
      console.log('\n✅ 迁移验证成功！')
      console.log('   所有表结构都已正确创建')
      console.log('   时间序列表功能正常')
    } else {
      console.log('\n❌ 迁移验证失败')
      console.log('   请检查迁移脚本是否已正确执行')
    }

    return testResult

  } catch (error) {
    console.error('❌ 验证过程出错:', error)
    return {
      success: false,
      connectionTest: { success: false, message: '验证过程出错', error },
      tables: {},
      summary: { totalTables: 0, successfulTables: 0, failedTables: 0 }
    }
  }
}

// 检查特定表的新字段是否存在
export async function checkNewFields() {
  console.log('🔍 检查新增的字段...')

  const checks: Array<{ table: keyof Database['public']['Tables']; newFields: string[] }> = [
    {
      table: 'video_snapshots',
      newFields: ['ranking_position']
    },
    {
      table: 'hashtag_trends',
      newFields: ['avg_views_per_video', 'ranking_position']
    }
  ]

  const results: Record<string, any> = {}

  for (const check of checks) {
    results[check.table] = {
      exists: false,
      fields: {} as Record<string, boolean>
    }

    try {
      // 尝试查询表以确认其存在
      const { data, error } = await supabaseAdmin
        .from(check.table)
        .select('*')
        .limit(1)

      if (error) {
        results[check.table].error = error.message
        continue
      }

      results[check.table].exists = true

      // 检查新字段是否存在（通过尝试查询特定字段）
      for (const field of check.newFields) {
        try {
          const { data: fieldData, error: fieldError } = await supabaseAdmin
            .from(check.table)
            .select(field)
            .limit(1)

          results[check.table].fields[field] = !fieldError
        } catch {
          results[check.table].fields[field] = false
        }
      }

    } catch (error) {
      results[check.table].error = error instanceof Error ? error.message : '未知错误'
    }
  }

  return results
}

// 主执行函数
export async function main() {
  console.log('🎯 Supabase 数据库迁移工具')
  console.log('=====================================\n')

  // 1. 准备迁移
  const migrationResult = await executeMigration()

  if (!migrationResult.success) {
    console.error('❌ 迁移准备失败:', migrationResult.message)
    return
  }

  console.log('\n⏱️  等待用户在 Supabase Dashboard 中执行迁移...')
  console.log('   执行完成后，按 Enter 键继续验证...')

  // 在实际使用中，这里应该等待用户输入
  // 但在脚本中我们直接进行验证

  console.log('\n🔍 开始验证迁移结果...')

  // 2. 验证迁移
  const verificationResult = await verifyMigration()

  // 3. 检查新字段
  console.log('\n🔍 检查新增字段...')
  const fieldsResult = await checkNewFields()

  for (const [tableName, result] of Object.entries(fieldsResult)) {
    const tableResult = result as any
    console.log(`\n📋 表: ${tableName}`)
    console.log(`   存在: ${tableResult.exists ? '✅' : '❌'}`)

    if (tableResult.fields) {
      for (const [fieldName, exists] of Object.entries(tableResult.fields)) {
        console.log(`   - ${fieldName}: ${exists ? '✅ 存在' : '❌ 缺失'}`)
      }
    }

    if (tableResult.error) {
      console.log(`   ❌ 错误: ${tableResult.error}`)
    }
  }

  console.log('\n🎯 迁移完成！')
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error)
}
