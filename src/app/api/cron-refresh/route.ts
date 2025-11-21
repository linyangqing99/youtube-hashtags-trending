import { NextRequest, NextResponse } from 'next/server'
import { runHourlyJob } from '@/lib/hourly-job'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  const expected = process.env.CRON_SECRET

  if (expected && token !== expected) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runHourlyJob()
    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Job failed' }, { status: 500 })
  }
}
