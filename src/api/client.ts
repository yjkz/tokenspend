import type { DashboardData, SessionSummary, SessionDetail, ProjectInfo, ConversationRound } from '../types'

const API_BASE = '/api'

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export function fetchDashboard(): Promise<DashboardData> {
  return request('/dashboard')
}

export function fetchSessions(project?: string): Promise<SessionSummary[]> {
  const qs = project ? `?project=${encodeURIComponent(project)}` : ''
  return request(`/sessions${qs}`)
}

export function fetchSessionDetail(id: string): Promise<SessionDetail> {
  return request(`/sessions/${encodeURIComponent(id)}`)
}

export function fetchProjects(): Promise<ProjectInfo[]> {
  return request('/projects')
}

export function fetchSessionRounds(id: string): Promise<ConversationRound[]> {
  return request(`/sessions/${encodeURIComponent(id)}/rounds`)
}
