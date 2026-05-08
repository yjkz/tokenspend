interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  color?: string
  index?: number
}

export default function StatCard({ title, value, subtitle, color = '#f472b6', index = 0 }: StatCardProps) {
  return (
    <div className={`glow-card p-5 animate-fade-in-up delay-${index + 1}`}>
      <div className="flex items-start gap-3">
        <div className="relative mt-1">
          <div
            className="w-2.5 h-10 rounded-full"
            style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}25` }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-pink-400 uppercase tracking-widest">{title}</p>
          <p className="text-2xl font-bold font-mono mt-1" style={{
            background: `linear-gradient(135deg, ${color}, ${color}bb)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>{value}</p>
          {subtitle && <p className="text-[11px] text-gray-400 mt-1 tracking-wide">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}
