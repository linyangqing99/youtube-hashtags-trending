import { Flame, Bell, HelpCircle, ChevronDown, Lock, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import Link from 'next/link';
import { fetchDashboardData } from '@/lib/dashboard-data';

function formatNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

function getHeatmapColorClass(value: number, maxValue: number) {
  if (maxValue === 0) return 'bg-gray-100 dark:bg-gray-800';
  const ratio = value / maxValue;
  if (ratio >= 0.75) return 'bg-heatmap-very-hot dark:bg-dark-heatmap-very-hot';
  if (ratio >= 0.5) return 'bg-heatmap-hot dark:bg-dark-heatmap-hot';
  if (ratio >= 0.25) return 'bg-heatmap-medium dark:bg-dark-heatmap-medium';
  if (value > 0) return 'bg-heatmap-low dark:bg-dark-heatmap-low';
  return 'bg-gray-100 dark:bg-gray-800';
}

export default async function HomePage() {
  const dashboard = await fetchDashboardData();

  const maxHeatValue = dashboard.heatmapRows.reduce((max, row) => {
    const rowMax = Math.max(...row.daily.map((d) => d.mentions));
    return Math.max(max, rowMax);
  }, 0);

  return (
    <div className="bg-background-light dark:bg-background-dark text-gray-800 dark:text-gray-200 min-h-screen font-display">
      <div className="flex flex-1 justify-center py-5">
        <div className="w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 dark:border-surface-dark px-4 py-3">
              <div className="flex items-center gap-4 text-gray-900 dark:text-white">
                <div className="size-6 text-primary">
                  <Flame className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">YouTube hashtags trending</h2>
              </div>
            <div className="flex flex-1 justify-end gap-6 items-center">
              <div className="hidden sm:flex items-center gap-8">
                <a className="text-sm font-medium leading-normal text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white" href="#">
                  Dashboard
                </a>
                <a className="text-sm font-medium leading-normal text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white" href="#">
                  Reports
                </a>
                <a className="text-sm font-medium leading-normal text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white" href="#">
                  Settings
                </a>
              </div>
              <div className="flex gap-2 items-center">
                <button className="flex items-center justify-center overflow-hidden rounded-full h-10 w-10 bg-gray-100 dark:bg-surface-dark text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <Bell className="h-5 w-5" />
                </button>
                <button className="flex items-center justify-center overflow-hidden rounded-full h-10 w-10 bg-gray-100 dark:bg-surface-dark text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <HelpCircle className="h-5 w-5" />
                </button>
                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" aria-label="User avatar" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCrOvdGi__CSYaKJQjRRSv3ZqXgzYVfzCo-9-oi5uSVQIsz9PUbIyIoMhpSrqN5smEYt1RpuJztzZ7sKh_wDEGLjKy24F3MhElr_KuSUWjNECpucb9LBJAyycX-Fz-MTEOyCUCL0_pfEj1eRggcaSxPuj9UpDkySKXSwXhtggLf7TxfrI8_pxIMj6KOFhP3CFTcYf4gBnMvvFVkaOWXmEYzujTcmlXRCTU1vWby4u5FmEVB6bOIpO_Lw1gSwzSvg7nnXa3hO-S1I24")' }} />
              </div>
            </div>
          </header>

          <main className="flex flex-col gap-8 mt-8">
            <div className="flex flex-wrap justify-between items-center gap-4 px-4">
              <div className="flex flex-col gap-1">
                <p className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Dashboard</p>
                <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">
                  An overview of YouTube hashtag trends in the US.
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal mt-1">
                  You’re viewing top hashtags from the most popular videos in the US over the last 7 hours. Times shown in UTC.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-surface-dark bg-white dark:bg-surface-dark p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3 flex-wrap">
                <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-gray-100 dark:bg-gray-700/50 pl-4 pr-2 text-gray-500 dark:text-gray-400 cursor-not-allowed">
                  <p className="text-sm font-medium leading-normal">Country: United States</p>
                  <Lock className="h-4 w-4" />
                </button>
                <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-gray-100 dark:bg-gray-700/50 pl-4 pr-2 text-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600/50 transition-colors">
                  <p className="text-sm font-medium leading-normal">Topic: All Topics</p>
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-gray-100 dark:bg-gray-700/50 pl-4 pr-2 text-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600/50 transition-colors">
                  <p className="text-sm font-medium leading-normal">Time Frame: Last 7 Hours</p>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors">
                <span className="truncate">Apply Filters</span>
              </button>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-gray-900 dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em]">
                    Top Trending Hashtags
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Last updated {new Date(dashboard.summary.lastUpdated).toLocaleString()}
                  </p>
                </div>
                {!dashboard.summary.hasLiveData && (
                  <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                    Demo data (Supabase未返回记录)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {dashboard.topHashtags.map((tag, index) => (
                  <div
                    key={tag.hashtagId ?? tag.hashtag}
                    className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 flex flex-col gap-2 relative border border-transparent hover:border-primary/30 transition-colors"
                  >
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      #{index + 1} Trending
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{tag.hashtag}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        {formatNumber(tag.mentions)} Mentions
                      </p>
                      <div
                        className={`flex items-center ${
                          tag.growthPercent >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        {tag.growthPercent >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span className="text-sm font-medium ml-1">
                          {tag.growthPercent >= 0 ? '+' : ''}
                          {tag.growthPercent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    {/* See Top Videos 暂时隐藏，避免遮挡 */}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-4 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Hashtag Analysis Heatmap</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Showing activity for the last 7 hours (UTC).</p>
                </div>
                <div className="relative">
                  <button className="appearance-none h-10 pl-4 pr-10 bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300 rounded-lg text-sm font-medium leading-normal hover:bg-gray-200 dark:hover:bg-gray-600/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors inline-flex items-center gap-2">
                    Sort by: 7-Day Mentions
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left table-fixed border-separate" style={{ borderSpacing: 0 }}>
                  <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                    <tr>
                      <th className="py-3 pr-6 font-medium w-48 border-b border-gray-200 dark:border-gray-700" scope="col">
                        Hashtag
                      </th>
                      {dashboard.dayLabels.map((label) => (
                        <th
                          key={label}
                          className="py-3 px-1 text-center font-medium w-16 border-b border-gray-200 dark:border-gray-700"
                          scope="col"
                        >
                          {label}
                        </th>
                      ))}
                      <th className="py-3 pl-6 font-medium w-48 border-b border-gray-200 dark:border-gray-700" scope="col">
                        7-Day Summary
                      </th>
                      <th className="py-3 pl-6 font-medium w-24 border-b border-gray-200 dark:border-gray-700" scope="col">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.heatmapRows.map((row) => (
                      <tr key={row.hashtagId} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-2 pr-6 font-medium text-gray-900 dark:text-white align-middle">
                          <Link href={`/tags/${row.hashtagId ?? row.hashtag.replace(/^#/, '')}`} className="hover:text-primary">
                            {row.hashtag}
                          </Link>
                        </td>
                        {row.daily.map((day) => (
                          <td key={day.date} className="p-1 align-middle">
                            <div
                              className={`relative group aspect-square rounded ${getHeatmapColorClass(
                                day.mentions,
                                maxHeatValue,
                              )}`}
                              title={`${row.hashtag} — ${day.date}\nMentions: ${formatNumber(day.mentions)}`}
                            />
                          </td>
                        ))}
                        <td className="py-2 pl-6 align-middle">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatNumber(row.totalMentions)} Mentions
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            7-Day Growth: {row.growthPercent >= 0 ? '+' : ''}
                            {row.growthPercent.toFixed(1)}%
                          </p>
                        </td>
                        <td className="py-2 pl-6 align-middle">
                          <button className="flex items-center justify-center h-9 w-9 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600/50 transition-colors" title="View Details">
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
