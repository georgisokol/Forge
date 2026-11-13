// A sword outlined stroke by stroke: blade first, then guard, then grip and pommel.
export default function Forging({ label = 'Forging' }) {
  return (
    <div className="screen center">
      <svg className="sword" width="110" height="230" viewBox="0 0 100 210" aria-hidden="true">
        <g>
          <path className="sw sw-blade" pathLength="1" d="M50 3 L63 30 L63 134 L37 134 L37 30 Z" />
          <path className="sw sw-blade" pathLength="1" d="M50 22 V126 M50 22 L44 32 M50 22 L56 32" />
          <path className="sw sw-guard" pathLength="1" d="M50 134 H37 L30 130 Q14 134 6 118 Q18 126 30 120 L37 122 V134 M63 134 L70 130 Q86 134 94 118 Q82 126 70 120 L63 122 V134 M37 134 Q37 144 50 144 Q63 144 63 134" />
          <path className="sw sw-grip" pathLength="1" d="M44 144 V180 H56 V144 M44 152 H56 M44 160 H56 M44 168 H56 M44 176 H56" />
          <path className="sw sw-grip" pathLength="1" d="M50 180 L62 192 L50 206 L38 192 Z" />
        </g>
      </svg>
      <p className="forge-label">{label}</p>
    </div>
  )
}
