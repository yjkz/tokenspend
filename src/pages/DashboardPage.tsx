import { useEffect, useState } from 'react'
import { fetchDashboard } from '../api/client'
import { useLanguage } from '../i18n'
import type { DashboardData } from '../types'
import StatCard from '../components/cards/StatCard'
import TokensByModelPie from '../components/charts/TokensByModelPie'
import DailyActivityBar from '../components/charts/DailyActivityBar'
import TokensOverTimeLine from '../components/charts/TokensOverTimeLine'

function formatNum(n: number) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

function pct(a: number, b: number) {
  const total = a + b
  return total > 0 ? ((a / total) * 100).toFixed(1) + '%' : '0%'
}

export default function DashboardPage() {
  const { t } = useLanguage()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard().then(setData).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-pink-400 animate-pulse text-sm tracking-widest uppercase">{t('loading')}</div>
    </div>
  )
  if (!data) return <div className="text-red-400 p-8">{t('failedToLoad')}</div>

  const totalTokens = data.totalInputTokens + data.totalOutputTokens + data.totalCacheReadTokens + data.totalCacheCreationTokens
  const cacheHitRate = pct(data.totalCacheReadTokens, data.totalInputTokens)
  const avgPerSession = data.totalSessions > 0 ? Math.round(totalTokens / data.totalSessions) : 0

  const lineData = data.dailyTokens.map(d => ({
    timestamp: d.date,
    input: d.input,
    output: d.output,
    cacheRead: d.cacheRead,
  }))

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold animate-fade-in">
        <span className="bg-gradient-to-r from-pink-400 via-rose-400 to-orange-400 bg-clip-text text-transparent">
          {t('dashboard')}
        </span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('totalTokens')} value={formatNum(totalTokens)} subtitle={`${data.totalRequests} ${t('requests')}`} color="#f472b6" index={0} />
        <StatCard title={t('sessions')} value={data.totalSessions} color="#fb923c" index={1} />
        <StatCard title={t('cacheHitRate')} value={cacheHitRate} subtitle={`${formatNum(data.totalCacheReadTokens)} ${t('cached')}`} color="#f9a8d4" index={2} />
        <StatCard title={t('avgTokensSession')} value={formatNum(avgPerSession)} color="#ff8c5a" index={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="animate-fade-in-up delay-5">
          <TokensByModelPie data={data.tokensByModel} />
        </div>
        <div className="animate-fade-in-up delay-6">
          <DailyActivityBar data={data.dailyTokens} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="animate-fade-in-up delay-7">
          <TokensOverTimeLine data={lineData} />
        </div>
        <div className="glow-card rounded-xl p-5 animate-fade-in-up delay-8">
          <h3 className="text-sm font-semibold text-pink-400 mb-4 tracking-wide uppercase">{t('topSessions')}</h3>
          <div className="space-y-2.5">
            {data.topSessions.slice(0, 8).map((s, i) => {
              const total = s.totalInputTokens + s.totalOutputTokens + s.totalCacheReadTokens + s.totalCacheCreationTokens
              const maxTotal = data.topSessions[0]
                ? data.topSessions[0].totalInputTokens + data.topSessions[0].totalOutputTokens + data.topSessions[0].totalCacheReadTokens + data.topSessions[0].totalCacheCreationTokens
                : 1
              const width = Math.max(2, (total / maxTotal) * 100)
              const colors = ['#f472b6', '#fb923c', '#f9a8d4', '#ff8c5a', '#ec4899', '#fbbf24', '#ff7f7f', '#c084fc']
              return (
                <div key={s.sessionId} className="flex items-center gap-3 group">
                  <div className="w-28 text-xs text-gray-500 truncate group-hover:text-pink-500 transition-colors" title={s.title || s.sessionId}>
                    {s.title || s.sessionId.slice(0, 8)}
                  </div>
                  <div className="flex-1 bg-pink-100 rounded-full h-5 relative overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${width}%`,
                        background: `linear-gradient(90deg, ${colors[i]}cc, ${colors[i]}80)`,
                        boxShadow: `0 0 8px ${colors[i]}30`,
                      }}
                    />
                  </div>
                  <div className="w-16 text-right text-xs font-mono text-gray-500">{formatNum(total)}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
