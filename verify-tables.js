// 验证时间序列表是否创建成功
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://isorrcmivuomzolnaxgi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlzb3JyY21pdnVvbXpvbG5heGdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MDg2NDgsImV4cCI6MjA3OTI4NDY0OH0.5wBVfHSIIxJQiq3NjlI0FY3w2x1WIjyLY8cuFBQhJsA'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlzb3JyY21pdnVvbXpvbG5heGdpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzcwODY0OCwiZXhwIjoyMDc5Mjg0NjQ4fQ.lndiwgB_NLDnMC4dWuqD6xDlQWuww1fDjGlQGDpI3EU'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function verifyTables() {
  console.log('🔍 验证时间序列表结构...\n')

  const tablesToCheck = [
    { name: 'video_snapshots', description: '视频快照表' },
    { name: 'hashtag_trends', description: 'Hashtag趋势表' }
  ]

  let allSuccess = true

  for (const table of tablesToCheck) {
    console.log(`📋 检查表: ${table.name} (${table.description})`)

    try {
      // 1. 检查表是否存在
      const { data, error } = await supabaseAdmin
        .from(table.name)
        .select('*')
        .limit(1)

      if (error) {
        console.log(`   ❌ 表不存在或无法访问: ${error.message}`)
        allSuccess = false
        continue
      }

      console.log(`   ✅ 表存在且可访问`)

      // 2. 检查表结构
      if (data.length > 0) {
        const columns = Object.keys(data[0])
        console.log(`   📊 表字段: ${columns.join(', ')}`)
      }

      // 3. 尝试插入测试数据（如果表为空）
      if (data.length === 0) {
        console.log(`   ℹ️  表为空，尝试插入测试数据...`)

        let testData = {}
        if (table.name === 'video_snapshots') {
          testData = {
            video_id: 'test_video_123',
            view_count: 1000,
            like_count: 50,
            comment_count: 10,
            snapshot_date: new Date().toISOString(),
            ranking_position: 1
          }
        } else if (table.name === 'hashtag_trends') {
          testData = {
            hashtag_id: 'test_hashtag_123',
            mention_count: 100,
            unique_videos: 50,
            total_views: 10000,
            avg_views_per_video: 200,
            trend_date: new Date().toISOString().split('T')[0],
            region_code: 'US',
            ranking_position: 5
          }
        }

        const { data: insertData, error: insertError } = await supabaseAdmin
          .from(table.name)
          .insert(testData)
          .select()

        if (insertError) {
          console.log(`   ❌ 插入测试数据失败: ${insertError.message}`)
          allSuccess = false
        } else {
          console.log(`   ✅ 测试数据插入成功`)

          // 清理测试数据
          const { error: deleteError } = await supabaseAdmin
            .from(table.name)
            .delete()
            .eq('id', insertData[0].id)

          if (deleteError) {
            console.log(`   ⚠️  清理测试数据失败: ${deleteError.message}`)
          } else {
            console.log(`   🧹 测试数据已清理`)
          }
        }
      }

    } catch (error) {
      console.log(`   ❌ 验证过程出错: ${error.message}`)
      allSuccess = false
    }

    console.log('')
  }

  // 4. 总结
  if (allSuccess) {
    console.log('🎉 所有时间序列表验证通过！')
    console.log('✅ 表结构正确')
    console.log('✅ 可以正常插入和查询数据')
  } else {
    console.log('💔 验证失败，请检查表是否已正确创建')
    console.log('\n💡 如果表不存在，请：')
    console.log('1. 访问 https://app.supabase.com/project/isorrcmivuomzolnaxgi/sql')
    console.log('2. 执行 create-timeseries-tables.sql 文件中的SQL语句')
  }

  return allSuccess
}

// 执行验证
verifyTables().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('验证过程出错:', error)
  process.exit(1)
})