import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useLanguage } from '../../i18n'

interface DayData {
  date: string
  input: number
  output: number
  cacheRead: number
  cacheCreation: number
}

function formatNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

export default function DailyActivityBar({ data }: { data: DayData[] }) {
  const { t } = useLanguage()
  if (data.length === 0) {
    return <div className="text-gray-500 text-sm p-4">{t('noData')}</div>
  }

  return (
    <div className="glow-card rounded-xl p-5">
      <h3 className="text-sm font-semibold text-pink-400 mb-4 tracking-wide uppercase">{t('dailyTokenUsage')}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <XAxis
            dataKey="date"
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
            contentStyle={{ background: '#ffffff', border: '1px solid rgba(244,114,182,0.2)', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', color: '#3d2c3e' }}
          />
          <Legend
            formatter={(v) => <span className="text-gray-300 text-xs">{v}</span>}
          />
          <Bar dataKey="input" stackId="a" fill="#f472b6" name={t('input')} radius={[2, 2, 0, 0]} />
          <Bar dataKey="output" stackId="a" fill="#fb923c" name={t('output')} radius={[2, 2, 0, 0]} />
          <Bar dataKey="cacheRead" stackId="a" fill="#6b2150" name={t('cacheRead')} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
