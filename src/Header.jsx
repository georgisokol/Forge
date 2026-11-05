export default function Header({ title, onBack }) {
  return (
    <div className="head">
      {onBack && (
        <button className="arrow" aria-label="Back" onClick={onBack}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
      )}
      <h2>{title}</h2>
    </div>
  )
}
