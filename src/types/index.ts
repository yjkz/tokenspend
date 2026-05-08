export interface TokenUsage {
  input_tokens: number
  output_tokens: number
  cache_read_input_tokens: number
  cache_creation_input_tokens: number
}

export interface SessionSummary {
  sessionId: string
  projectDir: string
  projectPath: string
  title?: string
  firstTimestamp: string
  lastTimestamp: string
  totalInputTokens: number
  totalOutputTokens: number
  totalCacheReadTokens: number
  totalCacheCreationTokens: number
  requestCount: number
  model: string
  fileSize: number
}

export interface RequestEntry {
  timestamp: string
  model: string
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheCreationTokens: number
  source: 'assistant' | 'tool_result'
  agentType?: string
}

export interface SessionDetail extends SessionSummary {
  requests: RequestEntry[]
}

export interface DashboardData {
  totalSessions: number
  totalInputTokens: number
  totalOutputTokens: number
  totalCacheReadTokens: number
  totalCacheCreationTokens: number
  totalRequests: number
  tokensByModel: Record<string, TokenUsage>
  dailyTokens: Array<{
    date: string
    input: number
    output: number
    cacheRead: number
    cacheCreation: number
  }>
  topSessions: SessionSummary[]
}

export interface ProjectInfo {
  projectDir: string
  projectPath: string
  sessionCount: number
  totalTokens: number
}

export interface RoundMessage {
  role: 'user' | 'assistant'
  content: string
  thinking?: string
  toolCalls?: Array<{ name: string; input: string }>
  timestamp: string
}

export interface ConversationRound {
  index: number
  userMessage: string
  userMessageFull: string
  timestamp: string
  totalInputTokens: number
  totalOutputTokens: number
  totalCacheReadTokens: number
  totalCacheCreationTokens: number
  totalTokens: number
  model: string
  messages: RoundMessage[]
}
