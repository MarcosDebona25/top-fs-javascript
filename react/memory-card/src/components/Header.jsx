function Header({ score, bestScore, onReset }) {
  return (
    <header className="header">
      <div className="masthead">
        <img src="/marvel-logo.png" alt="Marvel" className="header-logo" />
        <h1 className="header-subtitle">Memory Card</h1>
      </div>

      <div className="header-actions">
        <div className="scores">
          <div className="score">
            <span className="score-label">Score</span>
            <span className="score-value">{score}</span>
          </div>
          <div className="score score--best">
            <span className="score-label">Best</span>
            <span className="score-value">{bestScore}</span>
          </div>
        </div>

        <button
          type="button"
          className="reset"
          onClick={onReset}
          title="Reset game"
          aria-label="Reset game"
        >
          <svg
            className="reset-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </div>
    </header>
  )
}

export default Header
