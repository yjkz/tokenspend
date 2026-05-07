interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  color?: string
  index?: number
}

export default function StatCard({ title, value, subtitle, color = '#fbbf24', index = 0 }: StatCardProps) {
  return (
    <div className={`glow-card rounded-xl p-5 animate-fade-in-up delay-${index + 1}`}>
      <div className="flex items-start gap-3">
        <div className="relative mt-1">
          <div
            className="w-2.5 h-10 rounded-full"
            style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}40` }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-amber-400/70 uppercase tracking-widest">{title}</p>
          <p className="text-2xl font-bold font-mono mt-1" style={{
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>{value}</p>
          {subtitle && <p className="text-[11px] text-gray-500 mt-1 tracking-wide">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}
