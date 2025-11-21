'use server';

import { createClient } from '@supabase/supabase-js';

type TrendRow = {
  hashtag_id: number;
  mention_count: number;
  trend_at: string;
  total_views?: number | null;
  unique_videos?: number | null;
  ranking_position?: number | null;
};

type HashtagRow = {
  id: number;
  name: string;
  total_mentions?: number | null;
  total_views?: number | null;
  total_videos?: number | null;
  count?: number | null; // 兼容旧字段
};

type HeatmapDay = { date: string; mentions: number };

export type HeatmapRow = {
  hashtag: string;
  hashtagId: number;
  daily: HeatmapDay[];
  totalMentions: number;
  uniqueVideos?: number;
  totalViews?: number;
  growthPercent: number;
  ranking?: number | null;
};

export type TopHashtag = {
  hashtag: string;
  hashtagId?: number;
  mentions: number;
  growthPercent: number;
  ranking?: number | null;
};

export type DashboardData = {
  dayLabels: string[];
  heatmapRows: HeatmapRow[];
  topHashtags: TopHashtag[];
  summary: {
    totalHashtags: number;
    totalMentions: number;
    lastUpdated: string;
    hasLiveData: boolean;
    timeZoneLabel: string;
  };
};

function getLastNHours(hours: number) {
  const slots: string[] = [];
  const now = new Date();
  now.setUTCMinutes(0, 0, 0);

  for (let i = hours - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCHours(now.getUTCHours() - i);
    slots.push(d.toISOString());
  }

  return slots;
}

function formatHourLabel(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${d.getUTCHours().toString().padStart(2, '0')}:00 UTC`;
}

function buildFallbackData(): DashboardData {
  const hourKeys = getLastNHours(7);
  const sampleRows: HeatmapRow[] = [
    {
      hashtag: '#gaming',
      hashtagId: 1,
      daily: hourKeys.map((date, idx) => ({ date, mentions: 180000 + idx * 8000 })),
      totalMentions: 180000 * 7 + 8 * ((7 * 6) / 2),
      totalViews: 12000000,
      uniqueVideos: 420,
      growthPercent: 15,
      ranking: 1,
    },
    {
      hashtag: '#shorts',
      hashtagId: 2,
      daily: hourKeys.map((date, idx) => ({ date, mentions: 130000 + idx * 4000 })),
      totalMentions: 130000 * 7 + 4 * ((7 * 6) / 2),
      totalViews: 9200000,
      uniqueVideos: 360,
      growthPercent: 8,
      ranking: 2,
    },
    {
      hashtag: '#tech',
      hashtagId: 3,
      daily: hourKeys.map((date, idx) => ({ date, mentions: 110000 + idx * 2000 })),
      totalMentions: 110000 * 7 + 2 * ((7 * 6) / 2),
      totalViews: 7800000,
      uniqueVideos: 280,
      growthPercent: -3,
      ranking: 3,
    },
  ];

  return {
    dayLabels: hourKeys.map(formatHourLabel),
    heatmapRows: sampleRows,
    topHashtags: sampleRows.slice(0, 3).map((row) => ({
      hashtag: row.hashtag,
      hashtagId: row.hashtagId,
      mentions: row.totalMentions,
      growthPercent: row.growthPercent,
      ranking: row.ranking,
    })),
    summary: {
      totalHashtags: sampleRows.length,
      totalMentions: sampleRows.reduce((sum, row) => sum + row.totalMentions, 0),
      hasLiveData: false,
      lastUpdated: new Date().toISOString(),
      timeZoneLabel: 'UTC',
    },
  };
}

function computeGrowth(daily: HeatmapDay[]) {
  if (daily.length < 2) return 0;
  const last = daily[daily.length - 1]?.mentions ?? 0;
  const prev = daily[daily.length - 2]?.mentions ?? 0;
  if (prev === 0) return last > 0 ? 100 : 0;
  return ((last - prev) / prev) * 100;
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase 环境变量缺失，使用本地演示数据');
    return buildFallbackData();
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const hourKeys = getLastNHours(7);
  const windowStart = hourKeys[0];
  const windowEnd = hourKeys[hourKeys.length - 1];

  try {
    const { data: trends, error: trendsError } = await supabase
      .from('hashtag_trends_hourly')
      .select('hashtag_id, mention_count, trend_at, total_views, unique_videos, ranking_position')
      .gte('trend_at', windowStart)
      .lte('trend_at', windowEnd);

    if (trendsError) {
      console.error('读取 hashtag_trends_hourly 失败:', trendsError.message);
      return buildFallbackData();
    }

    if (!trends || trends.length === 0) {
      console.warn('hashtag_trends_hourly 表为空，使用本地演示数据');
      return buildFallbackData();
    }

    const hashtagIds = Array.from(new Set(trends.map((t) => t.hashtag_id)));

    const { data: hashtags, error: hashtagsError } = await supabase
      .from('hashtags')
      .select('id, name, count')
      .in('id', hashtagIds);

    if (hashtagsError) {
      console.error('读取 hashtags 失败:', hashtagsError.message);
      return buildFallbackData();
    }

    const hashtagMap = new Map<number, HashtagRow>();
    hashtags?.forEach((h) => hashtagMap.set(h.id, h));

    const rows = new Map<number, HeatmapRow>();

    hashtagIds.forEach((id) => {
      const tag = hashtagMap.get(id);
      rows.set(id, {
        hashtag: tag ? `#${tag.name}` : `#${id}`,
        hashtagId: id,
        daily: hourKeys.map((date) => ({ date, mentions: 0 })),
        totalMentions: 0,
        uniqueVideos: 0,
        totalViews: 0,
        growthPercent: 0,
        ranking: null,
      });
    });

    trends.forEach((trend: TrendRow) => {
      const row = rows.get(trend.hashtag_id);
      if (!row) return;

      const normalizedIso = new Date(trend.trend_at).toISOString();
      const dateIndex = hourKeys.findIndex((d) => d === normalizedIso);
      if (dateIndex !== -1) {
        row.daily[dateIndex] = { date: normalizedIso, mentions: trend.mention_count || 0 };
      }
      row.totalMentions += trend.mention_count || 0;
      row.uniqueVideos = (row.uniqueVideos || 0) + (trend.unique_videos || 0);
      row.totalViews = (row.totalViews || 0) + (trend.total_views || 0);
      row.ranking = row.ranking ?? trend.ranking_position ?? null;
    });

    const heatmapRows = Array.from(rows.values())
      .map((row) => ({
        ...row,
        growthPercent: computeGrowth(row.daily),
      }))
      .sort((a, b) => b.totalMentions - a.totalMentions);

    const topHashtags = heatmapRows.slice(0, 3).map((row, idx) => ({
      hashtag: row.hashtag,
      hashtagId: row.hashtagId,
      mentions: row.totalMentions,
      growthPercent: row.growthPercent,
      ranking: row.ranking ?? idx + 1,
    }));

    return {
      dayLabels: hourKeys.map(formatHourLabel),
      heatmapRows: heatmapRows.slice(0, 50),
      topHashtags,
      summary: {
        totalHashtags: heatmapRows.length,
        totalMentions: heatmapRows.reduce((sum, row) => sum + row.totalMentions, 0),
        hasLiveData: true,
        lastUpdated: new Date().toISOString(),
        timeZoneLabel: 'UTC',
      },
    };
  } catch (error) {
    console.error('获取仪表盘数据失败:', error);
    return buildFallbackData();
  }
}
