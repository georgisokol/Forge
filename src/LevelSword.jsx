import { useEffect, useState } from 'react'
import { getHistory } from './storage.js'

const WORKOUTS_PER_LEVEL = 10
const H = 210

const BLADE = 'M50 3 L63 30 L63 134 L37 134 L37 30 Z'
const GUARD = 'M50 134 H37 L30 130 Q14 134 6 118 Q18 126 30 120 L37 122 V144 Q37 144 50 144 Q63 144 63 144 V122 L70 120 Q82 126 94 118 Q86 134 70 130 L63 134 Z'
const GRIP = 'M44 144 H56 V180 H44 Z'
const POMMEL = 'M50 180 L62 192 L50 206 L38 192 Z'
const DETAILS = ['M50 22 V126', 'M44 152 H56', 'M44 160 H56', 'M44 168 H56', 'M44 176 H56']

// Shows the same sword as the loader, filling up from the hilt as workouts are completed (10 per level).
export default function LevelSword({ onClick }) {
  const count = getHistory().length
  const level = Math.floor(count / WORKOUTS_PER_LEVEL) + 1
  const into = count % WORKOUTS_PER_LEVEL
  const [fill, setFill] = useState(0)

  // Start empty on every mount so the fill animation always plays when the screen opens.
  useEffect(() => {
    const t = setTimeout(() => setFill(into / WORKOUTS_PER_LEVEL), 150)
    return () => clearTimeout(t)
  }, [into])

  const outline = [BLADE, GUARD, GRIP, POMMEL]
  return (
    <button type="button" className="level-sword" onClick={onClick} aria-label={`Level ${level}, ${into} of ${WORKOUTS_PER_LEVEL} workouts`}>
      <svg className="level-sword-svg" viewBox="0 0 210 100" aria-hidden="true">
        <defs>
          <clipPath id="sword-fill-clip">
            <rect x="0" y="0" width="100" height={H} className="level-sword-rise" style={{ transform: `translateY(${H * (1 - fill)}px)` }} />
          </clipPath>
        </defs>
        <g className="sword-glow" transform="translate(210 0) rotate(90)">
          <g clipPath="url(#sword-fill-clip)">
            {outline.map((d) => <path key={d} d={d} fill="var(--yellow)" fillOpacity=".85" />)}
          </g>
          {outline.map((d) => <path key={d} d={d} className="sw-static" />)}
          {DETAILS.map((d) => <path key={d} d={d} className="sw-static sw-detail" />)}
        </g>
      </svg>
      <div className="level-sword-text">
        <div className="level-sword-level">Level {level}</div>
        <div className="muted">{into} / {WORKOUTS_PER_LEVEL} to next level</div>
      </div>
    </button>
  )
}
