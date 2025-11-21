import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { notFound } from 'next/navigation';

async function getTagData(identifier: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  const supabase = createClient(supabaseUrl, supabaseKey);
  const numericId = Number(identifier);
  const slug = decodeURIComponent(identifier).replace(/^#/, '');

  const { data: tagRow, error: tagError } = await supabase
    .from('hashtags')
    .select('id, name')
    .or(Number.isNaN(numericId) ? `name.eq.${slug}` : `id.eq.${numericId},name.eq.${slug}`)
    .limit(1)
    .maybeSingle();

  if (tagError || !tagRow) return null;

  const end = new Date();
  end.setUTCMinutes(0, 0, 0);
  const start = new Date(end);
  start.setUTCHours(end.getUTCHours() - 24);

  const { data: trends, error: trendsError } = await supabase
    .from('hashtag_trends_hourly')
    .select('trend_at, mention_count, unique_videos, total_views')
    .eq('hashtag_id', tagRow.id)
    .gte('trend_at', start.toISOString())
    .lte('trend_at', end.toISOString())
    .order('trend_at', { ascending: false })
    .limit(24);

  if (trendsError) return null;

  return {
    tag: tagRow,
    trends: trends || [],
  };
}

function formatHour(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${d.getUTCHours().toString().padStart(2, '0')}:00 UTC`;
}

export default async function TagDetailPage({ params }: { params: { id: string } }) {
  const data = await getTagData(params.id);

  if (!data) return notFound();

  const totalMentions = data.trends.reduce((sum, t) => sum + (t.mention_count || 0), 0);
  const totalVideos = data.trends.reduce((sum, t) => sum + (t.unique_videos || 0), 0);
  const totalViews = data.trends.reduce((sum, t) => sum + (t.total_views || 0), 0);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Times shown in UTC</p>
            <h1 className="text-3xl font-bold mt-1">{`Hashtag: #${data.tag.name}`}</h1>
          </div>
          <Link href="/" className="text-sm font-medium text-primary hover:underline">
            ← Back to dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Mentions (last 24h)</p>
            <p className="text-2xl font-bold">{totalMentions}</p>
          </div>
          <div className="bg-white dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Unique Videos (last 24h)</p>
            <p className="text-2xl font-bold">{totalVideos}</p>
          </div>
          <div className="bg-white dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Views (last 24h)</p>
            <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Hourly Trend (last 24h)</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">UTC window</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-xs uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="py-2 pr-4">Hour</th>
                  <th className="py-2 pr-4">Mentions</th>
                  <th className="py-2 pr-4">Unique Videos</th>
                  <th className="py-2 pr-4">Total Views</th>
                </tr>
              </thead>
              <tbody>
                {data.trends.map((t) => (
                  <tr key={t.trend_at} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="py-2 pr-4">{formatHour(t.trend_at)}</td>
                    <td className="py-2 pr-4">{t.mention_count ?? 0}</td>
                    <td className="py-2 pr-4">{t.unique_videos ?? 0}</td>
                    <td className="py-2 pr-4">{(t.total_views || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
