export default function Forging({ label = 'Forging' }) {
  return (
    <div className="screen center">
      <svg className="forge-anim" width="220" height="160" viewBox="0 0 200 140" aria-hidden="true">
        <rect className="forge-bar" x="68" y="54" width="64" height="8" rx="2" />
        <path className="forge-anvil" d="M40 62 H160 L150 80 H126 L132 102 H152 V122 H48 V102 H68 L74 80 H50 Z" />
        <g className="forge-hammer">
          <rect x="100" y="44" width="52" height="6" rx="3" fill="#8d939d" />
          <rect x="84" y="30" width="20" height="30" rx="3" fill="#f1f1ee" />
        </g>
        {[[-34, -30], [-12, -42], [12, -42], [34, -30], [-46, -8], [46, -8]].map(([x, y], i) => (
          <circle key={i} className="forge-spark" cx="100" cy="54" r="2.5" style={{ '--x': `${x}px`, '--y': `${y}px` }} />
        ))}
      </svg>
      <p className="forge-label">{label}</p>
    </div>
  )
}
