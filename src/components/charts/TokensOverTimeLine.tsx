import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useLanguage } from '../../i18n'

interface DataPoint {
  timestamp: string
  input: number
  output: number
  cacheRead: number
}

function formatNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

export default function TokensOverTimeLine({ data }: { data: DataPoint[] }) {
  const { t } = useLanguage()
  if (data.length === 0) {
    return <div className="text-gray-500 text-sm p-4">{t('noData')}</div>
  }

  return (
    <div className="glow-card rounded-xl p-5">
      <h3 className="text-sm font-medium text-amber-400/80 mb-4 tracking-wide uppercase">{t('tokensOverTime')}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <XAxis
            dataKey="timestamp"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatNum}
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(v: number) => formatNum(v)}
            contentStyle={{ background: '#1a2028', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
          />
          <Legend
            formatter={(v) => <span className="text-gray-300 text-xs">{v}</span>}
          />
          <Line type="monotone" dataKey="input" stroke="#fbbf24" name={t('input')} dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="output" stroke="#fb923c" name={t('output')} dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="cacheRead" stroke="#92400e" name={t('cacheRead')} dot={false} strokeDasharray="5 5" strokeWidth={1.5} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
