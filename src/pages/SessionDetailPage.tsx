import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { fetchSessionDetail, fetchSessionRounds } from '../api/client'
import { useLanguage } from '../i18n'
import type { SessionDetail, ConversationRound } from '../types'

function formatNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

function formatTime(s: string, locale: string) {
  return new Date(s).toLocaleString(locale)
}

function formatTimeShort(s: string, locale: string) {
  return new Date(s).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
}

export default function SessionDetailPage() {
  const { lang, t } = useLanguage()
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<SessionDetail | null>(null)
  const [rounds, setRounds] = useState<ConversationRound[]>([])
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [roundsLoading, setRoundsLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetchSessionDetail(id).then(setData).catch(console.error).finally(() => setLoading(false))
    fetchSessionRounds(id).then(setRounds).catch(console.error).finally(() => setRoundsLoading(false))
  }, [id])

  function toggleRound(index: number) {
    setExpandedRounds(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const locale = lang === 'zh' ? 'zh-CN' : 'en-US'

  if (loading) return <div className="text-pink-400 p-8">{t('loading')}</div>
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
        <Link to="/sessions" className="text-sm text-pink-500 hover:underline">&larr; {t('backToSessions')}</Link>
        <h2 className="text-xl font-bold text-gray-800 mt-1">{data.title || data.sessionId}</h2>
        <p className="text-xs text-gray-400 mt-0.5">{data.projectPath || data.projectDir} &middot; {formatTime(data.firstTimestamp, locale)} — {formatTime(data.lastTimestamp, locale)}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3 border border-pink-200 shadow-sm">
          <p className="text-xs text-gray-400">{t('input')}</p>
          <p className="text-lg font-bold text-pink-500">{formatNum(data.totalInputTokens)}</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-pink-200 shadow-sm">
          <p className="text-xs text-gray-400">{t('output')}</p>
          <p className="text-lg font-bold text-orange-400">{formatNum(data.totalOutputTokens)}</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-pink-200 shadow-sm">
          <p className="text-xs text-gray-400">{t('cacheRead')}</p>
          <p className="text-lg font-bold text-gray-500">{formatNum(data.totalCacheReadTokens)}</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-pink-200 shadow-sm">
          <p className="text-xs text-gray-400">{t('requests')}</p>
          <p className="text-lg font-bold text-gray-700">{data.requestCount}</p>
        </div>
      </div>

      {/* Conversation Rounds */}
      {!roundsLoading && rounds.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-pink-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-pink-400">{t('rounds')} ({rounds.length} {t('roundsCount')})</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setExpandedRounds(new Set(rounds.map(r => r.index)))}
                className="text-xs text-pink-400 hover:text-pink-600 transition-colors"
              >
                {t('expandAll')}
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setExpandedRounds(new Set())}
                className="text-xs text-pink-400 hover:text-pink-600 transition-colors"
              >
                {t('collapseAll')}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {rounds.map(round => {
              const isExpanded = expandedRounds.has(round.index)
              return (
                <div
                  key={round.index}
                  className="border border-pink-100 rounded-xl overflow-hidden transition-all hover:border-pink-200"
                >
                  {/* Round Header */}
                  <button
                    onClick={() => toggleRound(round.index)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-pink-50/50 transition-colors"
                  >
                    <span className="text-gray-400 text-xs w-4">{isExpanded ? '▼' : '▶'}</span>
                    <span className="text-xs font-bold text-pink-400 bg-pink-50 rounded-full px-2 py-0.5">#{round.index}</span>
                    <span className="flex-1 text-sm text-gray-700 truncate">{round.userMessage}</span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{formatTimeShort(round.timestamp, locale)}</span>
                    <span className="text-xs font-mono text-pink-500 whitespace-nowrap">{formatNum(round.totalTokens)}</span>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">{round.model}</span>
                  </button>

                  {/* Round Messages */}
                  {isExpanded && (
                    <div className="border-t border-pink-100 px-4 py-3 space-y-3 bg-pink-50/30">
                      {round.messages.map((msg, mi) => (
                        <div key={mi} className="flex gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {msg.role === 'user' ? (
                              <span className="inline-block w-6 h-6 rounded-full bg-pink-400 text-white text-[10px] text-center leading-6">U</span>
                            ) : (
                              <span className="inline-block w-6 h-6 rounded-full bg-orange-400 text-white text-[10px] text-center leading-6">A</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            {msg.content && (
                              <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{msg.content}</p>
                            )}
                            {msg.thinking && (
                              <details className="mt-1">
                                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">{t('thinking')}</summary>
                                <p className="text-xs text-gray-400 italic mt-1 whitespace-pre-wrap bg-gray-50 rounded-lg p-2">{msg.thinking}</p>
                              </details>
                            )}
                            {msg.toolCalls?.map((tc, ti) => (
                              <div key={ti} className="mt-1 bg-gray-50 rounded-lg p-2">
                                <p className="text-xs font-mono text-pink-500">{t('toolCall')}: {tc.name}</p>
                                <pre className="text-[11px] text-gray-500 mt-1 whitespace-pre-wrap overflow-x-auto max-h-32 overflow-y-auto">{tc.input}</pre>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Per-Request Token Breakdown Chart */}
      <div className="bg-white rounded-xl p-5 border border-pink-200 shadow-sm">
        <h3 className="text-sm font-semibold text-pink-400 mb-3">{t('perRequestBreakdown')}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="idx" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatNum} tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: number) => formatNum(v)} contentStyle={{ background: '#ffffff', border: '1px solid rgba(244,114,182,0.2)', borderRadius: 8, color: '#3d2c3e' }} />
            <Legend formatter={(v) => <span className="text-gray-600 text-xs">{v}</span>} />
            <Bar dataKey="input" stackId="a" fill="#f472b6" name={t('input')} />
            <Bar dataKey="output" stackId="a" fill="#fb923c" name={t('output')} />
            <Bar dataKey="cacheRead" stackId="a" fill="#f9a8d4" name={t('cacheRead')} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Request Details Table */}
      <div className="bg-white rounded-xl p-5 border border-pink-200 shadow-sm">
        <h3 className="text-sm font-semibold text-pink-400 mb-3">{t('requestDetails')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-pink-200/60">
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
                <tr key={i} className="border-b border-pink-100">
                  <td className="py-1.5 pr-3 text-gray-400">{i + 1}</td>
                  <td className="py-1.5 pr-3 text-gray-500 text-xs">{formatTime(r.timestamp, locale)}</td>
                  <td className="py-1.5 pr-3 text-gray-600 text-xs">{r.model}</td>
                  <td className="py-1.5 pr-3 text-gray-500 text-xs">{r.source}{r.agentType ? ` (${r.agentType})` : ''}</td>
                  <td className="py-1.5 pr-3 text-right text-pink-500">{formatNum(r.inputTokens)}</td>
                  <td className="py-1.5 pr-3 text-right text-orange-400">{formatNum(r.outputTokens)}</td>
                  <td className="py-1.5 pr-3 text-right text-gray-400">{formatNum(r.cacheReadTokens)}</td>
                  <td className="py-1.5 text-right text-gray-700">{formatNum(r.inputTokens + r.outputTokens + r.cacheReadTokens)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
