import { useEffect, useState } from 'react'
import { fetchSessions } from '../api/client'
import { useLanguage } from '../i18n'
import type { SessionSummary } from '../types'
import SessionTable from '../components/sessions/SessionTable'

export default function SessionsPage() {
  const { t } = useLanguage()
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSessions().then(setSessions).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-gray-400 p-8">{t('loading')}</div>

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">{t('sessions')} ({sessions.length})</h2>
      <SessionTable sessions={sessions} />
    </div>
  )
}
