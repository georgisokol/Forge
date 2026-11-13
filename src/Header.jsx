// Back arrow for live sessions: leaves silently if nothing is banked, otherwise ends the workout like Finish.
export function SessionBack({ banked, onBack, onFinish }) {
  return (
    <button className="arrow" aria-label={banked ? 'Finish workout' : 'Back'} onClick={banked ? onFinish : onBack}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 5l-7 7 7 7" />
      </svg>
    </button>
  )
}

export default function Header({ title, onBack, right }) {
  return (
    <div className="head" style={onBack ? undefined : { marginLeft: 0 }}>
      {onBack && (
        <button className="arrow" aria-label="Back" onClick={onBack}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
      )}
      <h2 style={{ flex: 1 }}>{title}</h2>
      {right}
    </div>
  )
}
