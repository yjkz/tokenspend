import type { ConversationRound, RoundMessage } from './types.js'

export function extractRounds(records: Record<string, unknown>[]): ConversationRound[] {
  const rounds: ConversationRound[] = []
  let currentRound: {
    userMessage: string
    userMessageFull: string
    timestamp: string
    model: string
    messages: RoundMessage[]
    totalInput: number
    totalOutput: number
    totalCacheRead: number
    totalCacheCreation: number
  } | null = null

  // Sort by timestamp
  const sorted = [...records].sort((a, b) => {
    const ta = String(a.timestamp || '')
    const tb = String(b.timestamp || '')
    return ta.localeCompare(tb)
  })

  for (const record of sorted) {
    const type = record.type as string
    const message = record.message as Record<string, unknown> | undefined

    if (type === 'user' && message) {
      const content = message.content
      // User text message (string content) = new round starter
      if (typeof content === 'string' && content.length > 0) {
        // Save previous round
        if (currentRound) {
          rounds.push(buildRound(rounds.length + 1, currentRound))
        }
        currentRound = {
          userMessage: content.length > 80 ? content.slice(0, 80) + '...' : content,
          userMessageFull: content,
          timestamp: String(record.timestamp || ''),
          model: '',
          messages: [{ role: 'user', content, timestamp: String(record.timestamp || '') }],
          totalInput: 0,
          totalOutput: 0,
          totalCacheRead: 0,
          totalCacheCreation: 0,
        }
      }
      // User tool-result message (array content) = part of current round
      else if (Array.isArray(content) && currentRound) {
        const toolUseResult = record.toolUseResult as Record<string, unknown> | undefined
        if (toolUseResult) {
          const usage = toolUseResult.usage as Record<string, number> | undefined
          if (usage) {
            currentRound.totalInput += usage.input_tokens || 0
            currentRound.totalOutput += usage.output_tokens || 0
            currentRound.totalCacheRead += usage.cache_read_input_tokens || 0
            currentRound.totalCacheCreation += usage.cache_creation_input_tokens || 0
          }
          const agentType = toolUseResult.agentType as string
          currentRound.messages.push({
            role: 'assistant',
            content: `[Tool Result: ${agentType || 'tool'}]`,
            timestamp: String(record.timestamp || ''),
          })
        }
      }
    }

    if (type === 'assistant' && message && currentRound) {
      const model = message.model as string
      if (model) currentRound.model = model

      const usage = message.usage as Record<string, number> | undefined
      if (usage) {
        currentRound.totalInput += usage.input_tokens || 0
        currentRound.totalOutput += usage.output_tokens || 0
        currentRound.totalCacheRead += usage.cache_read_input_tokens || 0
        currentRound.totalCacheCreation += usage.cache_creation_input_tokens || 0
      }

      // Extract content blocks
      const contentArr = message.content as Array<Record<string, unknown>> | undefined
      if (Array.isArray(contentArr)) {
        for (const block of contentArr) {
          if (block.type === 'text' && block.text) {
            currentRound.messages.push({
              role: 'assistant',
              content: String(block.text),
              timestamp: String(record.timestamp || ''),
            })
          } else if (block.type === 'thinking' && block.thinking) {
            currentRound.messages.push({
              role: 'assistant',
              content: '',
              thinking: String(block.thinking),
              timestamp: String(record.timestamp || ''),
            })
          } else if (block.type === 'tool_use') {
            const inputStr = typeof block.input === 'object' ? JSON.stringify(block.input, null, 2) : String(block.input || '')
            currentRound.messages.push({
              role: 'assistant',
              content: '',
              toolCalls: [{ name: String(block.name || ''), input: inputStr }],
              timestamp: String(record.timestamp || ''),
            })
          }
        }
      }
    }
  }

  // Don't forget the last round
  if (currentRound) {
    rounds.push(buildRound(rounds.length + 1, currentRound))
  }

  return rounds
}

function buildRound(index: number, round: { userMessage: string; userMessageFull: string; timestamp: string; model: string; messages: RoundMessage[]; totalInput: number; totalOutput: number; totalCacheRead: number; totalCacheCreation: number }): ConversationRound {
  return {
    index,
    userMessage: round.userMessage,
    userMessageFull: round.userMessageFull,
    timestamp: round.timestamp,
    totalInputTokens: round.totalInput,
    totalOutputTokens: round.totalOutput,
    totalCacheReadTokens: round.totalCacheRead,
    totalCacheCreationTokens: round.totalCacheCreation,
    totalTokens: round.totalInput + round.totalOutput + round.totalCacheRead + round.totalCacheCreation,
    model: round.model,
    messages: round.messages,
  }
}
