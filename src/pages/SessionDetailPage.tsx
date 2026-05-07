import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { fetchSessionDetail } from '../api/client'
import { useLanguage } from '../i18n'
import type { SessionDetail } from '../types'

function formatNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

function formatTime(s: string, locale: string) {
  return new Date(s).toLocaleString(locale)
}

export default function SessionDetailPage() {
  const { lang, t } = useLanguage()
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<SessionDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetchSessionDetail(id).then(setData).catch(console.error).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-gray-400 p-8">{t('loading')}</div>
  if (!data) return <div className="text-red-400 p-8">{t('sessionNotFound')}</div>

  const chartData = data.requests.map((r, i) => ({
    idx: i + 1,
    input: r.inputTokens,
    output: r.outputTokens,
    cacheRead: r.cacheReadTokens,
  }))

  return (
    <div className="space-y-6">
      <div>
        <Link to="/sessions" className="text-sm text-blue-400 hover:underline">&larr; {t('backToSessions')}</Link>
        <h2 className="text-xl font-bold text-white mt-1">{data.title || data.sessionId}</h2>
        <p className="text-xs text-gray-500 mt-0.5">{data.projectPath || data.projectDir} &middot; {formatTime(data.firstTimestamp, lang === 'zh' ? 'zh-CN' : 'en-US')} — {formatTime(data.lastTimestamp, lang === 'zh' ? 'zh-CN' : 'en-US')}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gray-800 rounded p-3 border border-gray-700">
          <p className="text-xs text-gray-400">{t('input')}</p>
          <p className="text-lg font-bold text-blue-400">{formatNum(data.totalInputTokens)}</p>
        </div>
        <div className="bg-gray-800 rounded p-3 border border-gray-700">
          <p className="text-xs text-gray-400">{t('output')}</p>
          <p className="text-lg font-bold text-green-400">{formatNum(data.totalOutputTokens)}</p>
        </div>
        <div className="bg-gray-800 rounded p-3 border border-gray-700">
          <p className="text-xs text-gray-400">{t('cacheRead')}</p>
          <p className="text-lg font-bold text-gray-300">{formatNum(data.totalCacheReadTokens)}</p>
        </div>
        <div className="bg-gray-800 rounded p-3 border border-gray-700">
          <p className="text-xs text-gray-400">{t('requests')}</p>
          <p className="text-lg font-bold text-white">{data.requestCount}</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-medium text-gray-300 mb-3">{t('perRequestBreakdown')}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="idx" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatNum} tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: number) => formatNum(v)} contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 6 }} />
            <Legend formatter={(v) => <span className="text-gray-300 text-xs">{v}</span>} />
            <Bar dataKey="input" stackId="a" fill="#3b82f6" name={t('input')} />
            <Bar dataKey="output" stackId="a" fill="#22c55e" name={t('output')} />
            <Bar dataKey="cacheRead" stackId="a" fill="#6b7280" name={t('cacheRead')} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-medium text-gray-300 mb-3">{t('requestDetails')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="pb-2 pr-3">#</th>
                <th className="pb-2 pr-3">{t('time')}</th>
                <th className="pb-2 pr-3">{t('model')}</th>
                <th className="pb-2 pr-3">{t('source')}</th>
                <th className="pb-2 pr-3 text-right">{t('input')}</th>
                <th className="pb-2 pr-3 text-right">{t('output')}</th>
                <th className="pb-2 pr-3 text-right">{t('cache')}</th>
                <th className="pb-2 text-right">{t('total')}</th>
              </tr>
            </thead>
            <tbody>
              {data.requests.map((r, i) => (
                <tr key={i} className="border-b border-gray-800/50">
                  <td className="py-1.5 pr-3 text-gray-500">{i + 1}</td>
                  <td className="py-1.5 pr-3 text-gray-400 text-xs">{formatTime(r.timestamp, lang === 'zh' ? 'zh-CN' : 'en-US')}</td>
                  <td className="py-1.5 pr-3 text-gray-300 text-xs">{r.model}</td>
                  <td className="py-1.5 pr-3 text-gray-400 text-xs">{r.source}{r.agentType ? ` (${r.agentType})` : ''}</td>
                  <td className="py-1.5 pr-3 text-right text-blue-400">{formatNum(r.inputTokens)}</td>
                  <td className="py-1.5 pr-3 text-right text-green-400">{formatNum(r.outputTokens)}</td>
                  <td className="py-1.5 pr-3 text-right text-gray-400">{formatNum(r.cacheReadTokens)}</td>
                  <td className="py-1.5 text-right text-white">{formatNum(r.inputTokens + r.outputTokens + r.cacheReadTokens)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
