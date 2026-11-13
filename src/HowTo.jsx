import { useState } from 'react'
import { exerciseArt } from './figures.js'
import { Button } from '@/components/ui/button'

function Shape({ s }) {
  if (s.t === 'rect') return <rect x={s.x} y={s.y} width={s.w} height={s.h} rx="2" fill="var(--line)" stroke="none" />
  if (s.t === 'line') return <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="var(--muted)" strokeWidth="3" />
  if (s.t === 'hand') return <circle cx={s.x} cy={s.y} r="3.2" fill="var(--yellow)" stroke="none" />
  if (s.t === 'diamond') return <polygon points={`${s.x},${s.y - s.s} ${s.x + s.s},${s.y} ${s.x},${s.y + s.s} ${s.x - s.s},${s.y}`} strokeWidth="2" />
  if (s.t === 'chev') return <polyline points={`${s.x - 4},${s.y + 3} ${s.x},${s.y - 2} ${s.x + 4},${s.y + 3}`} strokeWidth="2" />
  return null
}

export function Figure({ fig, label }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <svg viewBox="0 0 130 96" className="w-full rounded-xl border border-[var(--line)] bg-[var(--panel)]" role="img" aria-label={label}>
        {fig.ground != null && <line x1="8" x2="122" y1={fig.ground + 2} y2={fig.ground + 2} stroke="var(--line)" strokeWidth="2" strokeLinecap="round" />}
        {fig.bar != null && <line x1="10" x2="120" y1={fig.bar} y2={fig.bar} stroke="var(--muted)" strokeWidth="3" strokeLinecap="round" />}
        {fig.wall != null && <line x1={fig.wall} x2={fig.wall} y1="10" y2="90" stroke="var(--line)" strokeWidth="3" strokeLinecap="round" />}
        <g fill="none" stroke="var(--yellow)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          {fig.shapes.map((s, i) => <Shape key={i} s={s} />)}
          {fig.lines.map((l, i) => (
            <polyline key={i} points={l.pts.map((p) => p.join(',')).join(' ')} opacity={l.far ? 0.45 : 1} />
          ))}
          <circle cx={fig.head[0]} cy={fig.head[1]} r={fig.headR} fill="var(--panel)" />
        </g>
      </svg>
      <span className="muted text-xs uppercase tracking-widest">{label}</span>
    </div>
  )
}

// Small "How to" button that opens a popup with start/end illustrations; renders nothing without art.
export default function HowTo({ name }) {
  const [open, setOpen] = useState(false)
  const art = exerciseArt(name)
  if (!art) return null
  return (
    <>
      <Button variant="outline" size="sm" className="absolute bottom-3 left-1/2 -translate-x-1/2" onClick={() => setOpen(true)}>How to</Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setOpen(false)}>
          <div className="card flex max-h-[92dvh] w-full max-w-md flex-col gap-3 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-center text-xl">{name}</h2>
            {art.views.map((v) => (
              <div key={v.label} className="flex gap-2">
                <Figure fig={v.figures[0]} label={`${v.label} · start`} />
                <Figure fig={v.figures[1]} label={`${v.label} · end`} />
              </div>
            ))}
            <p className="muted m-0 text-center text-sm">{art.note}</p>
            <Button variant="muted" onClick={() => setOpen(false)}>Close</Button>
          </div>
        </div>
      )}
    </>
  )
}
