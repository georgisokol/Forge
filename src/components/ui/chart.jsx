import { ResponsiveContainer, Tooltip } from 'recharts'
import { cn } from '@/lib/utils'

// config: { [key]: { label, color } } exposed as --color-<key> CSS variables
function ChartContainer({ config, className, children }) {
  const vars = Object.fromEntries(Object.entries(config).map(([k, v]) => [`--color-${k}`, v.color]))
  return (
    <div data-slot="chart" style={vars} className={cn('h-full w-full text-xs [&_.recharts-cartesian-axis-tick_text]:fill-[var(--muted)]', className)}>
      <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
    </div>
  )
}

function ChartTooltipContent({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="grid min-w-32 gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-xs">
      <div className="font-medium text-[var(--text)]">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: p.stroke }} />
          <span className="text-[var(--muted)]">{p.name}</span>
          <span className="ml-auto pl-3 font-mono font-medium tabular-nums text-[var(--text)]">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

const ChartTooltip = (props) => <Tooltip cursor={{ stroke: 'var(--line)', strokeDasharray: '4 4' }} content={<ChartTooltipContent />} {...props} />

export { ChartContainer, ChartTooltip, ChartTooltipContent }
