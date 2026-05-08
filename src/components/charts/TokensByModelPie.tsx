import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { TokenUsage } from '../../types'
import { useLanguage } from '../../i18n'

const COLORS = ['#f472b6', '#fb923c', '#f9a8d4', '#ff8c5a', '#ec4899']

function formatNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

export default function TokensByModelPie({ data }: { data: Record<string, TokenUsage> }) {
  const { t } = useLanguage()
  const chartData = Object.entries(data).map(([name, usage]) => ({
    name,
    value: usage.input_tokens + usage.output_tokens + usage.cache_read_input_tokens + usage.cache_creation_input_tokens,
  })).sort((a, b) => b.value - a.value)

  if (chartData.length === 0) {
    return <div className="text-gray-500 text-sm p-4">{t('noData')}</div>
  }

  return (
    <div className="glow-card rounded-xl p-5">
      <h3 className="text-sm font-medium text-pink-300/80 mb-4 tracking-wide uppercase">{t('tokensByModel')}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number) => formatNum(v)}
            contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 6 }}
          />
          <Legend
            formatter={(v) => <span className="text-gray-300 text-xs">{v}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
