import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { SessionSummary } from '../../types'
import { useLanguage } from '../../i18n'

type SortKey = 'totalTokens' | 'requestCount' | 'lastTimestamp'

function formatNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

function formatDate(s: string, locale: string) {
  return new Date(s).toLocaleDateString(locale, { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function SessionTable({ sessions }: { sessions: SessionSummary[] }) {
  const { lang, t } = useLanguage()
  const [sortKey, setSortKey] = useState<SortKey>('totalTokens')
  const [sortAsc, setSortAsc] = useState(false)
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const navigate = useNavigate()

  const projects = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of sessions) {
      const path = s.projectPath || s.projectDir
      map.set(path, (map.get(path) || 0) + 1)
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [sessions])

  const filtered = useMemo(() => {
    let result = sessions
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(s =>
        (s.title || '').toLowerCase().includes(q) ||
        s.sessionId.toLowerCase().includes(q) ||
        (s.projectPath || s.projectDir).toLowerCase().includes(q)
      )
    }
    if (projectFilter) {
      result = result.filter(s => (s.projectPath || s.projectDir) === projectFilter)
    }
    return result
  }, [sessions, search, projectFilter])

  const sorted = [...filtered].sort((a, b) => {
    let va: number, vb: number
    if (sortKey === 'totalTokens') {
      va = a.totalInputTokens + a.totalOutputTokens + a.totalCacheReadTokens
      vb = b.totalInputTokens + b.totalOutputTokens + b.totalCacheReadTokens
    } else if (sortKey === 'requestCount') {
      va = a.requestCount
      vb = b.requestCount
    } else {
      va = new Date(a.lastTimestamp).getTime()
      vb = new Date(b.lastTimestamp).getTime()
    }
    return sortAsc ? va - vb : vb - va
  })

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(false) }
  }

  const arrow = (key: SortKey) => sortKey === key ? (sortAsc ? ' ↑' : ' ↓') : ''

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('search')}
            className="w-full bg-white/[0.04] border border-amber-500/10 rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500/30 focus:ring-1 focus:ring-amber-500/20 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>
        <select
          value={projectFilter}
          onChange={e => setProjectFilter(e.target.value)}
          className="bg-white/[0.04] border border-amber-500/10 rounded-lg px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-amber-500/30 appearance-none cursor-pointer min-w-[160px]"
        >
          <option value="">{t('allProjects')} ({sessions.length})</option>
          {projects.map(([path, count]) => (
            <option key={path} value={path}>{path.split('\\').pop() || path} ({count})</option>
          ))}
        </select>
      </div>

      {(search || projectFilter) && (
        <div className="text-xs text-gray-500 mb-3">
          {sorted.length} / {sessions.length}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-700">
              <th className="pb-2 pr-4">{t('title')}</th>
              <th className="pb-2 pr-4">{t('project')}</th>
              <th className="pb-2 pr-4 cursor-pointer hover:text-white" onClick={() => toggleSort('lastTimestamp')}>
                {t('date')}{arrow('lastTimestamp')}
              </th>
              <th className="pb-2 pr-4 text-right">{t('input')}</th>
              <th className="pb-2 pr-4 text-right">{t('output')}</th>
              <th className="pb-2 pr-4 text-right">{t('cacheRead')}</th>
              <th className="pb-2 pr-4 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('totalTokens')}>
                {t('total')}{arrow('totalTokens')}
              </th>
              <th className="pb-2 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('requestCount')}>
                {t('requests')}{arrow('requestCount')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(s => {
              const total = s.totalInputTokens + s.totalOutputTokens + s.totalCacheReadTokens + s.totalCacheCreationTokens
              return (
                <tr
                  key={s.sessionId}
                  className="border-b border-gray-800/50 hover:bg-white/[0.02] cursor-pointer transition-colors"
                  onClick={() => navigate(`/sessions/${s.sessionId}`)}
                >
                  <td className="py-2.5 pr-4 text-gray-200 truncate max-w-[200px]">{s.title || s.sessionId.slice(0, 8)}</td>
                  <td className="py-2.5 pr-4 text-gray-500 text-xs">{s.projectPath || s.projectDir}</td>
                  <td className="py-2.5 pr-4 text-gray-400">{formatDate(s.lastTimestamp, lang === 'zh' ? 'zh-CN' : 'en-US')}</td>
                  <td className="py-2.5 pr-4 text-right text-amber-400">{formatNum(s.totalInputTokens)}</td>
                  <td className="py-2.5 pr-4 text-right text-orange-400">{formatNum(s.totalOutputTokens)}</td>
                  <td className="py-2.5 pr-4 text-right text-gray-500">{formatNum(s.totalCacheReadTokens)}</td>
                  <td className="py-2.5 pr-4 text-right text-amber-200 font-medium">{formatNum(total)}</td>
                  <td className="py-2.5 text-right text-gray-400">{s.requestCount}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
