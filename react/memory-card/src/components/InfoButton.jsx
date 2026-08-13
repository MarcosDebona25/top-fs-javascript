import { useState } from 'react'

function InfoButton() {
  const [open, setOpen] = useState(false)

  return (
    <div className={`info ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="info-button"
        aria-label="How to play"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg
          className="info-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </button>

      <div className="info-popover" role="tooltip">
        <p className="info-title">How to play</p>
        <ul className="info-list">
          <li>Click a hero to score a point.</li>
          <li>Cards shuffle after every click.</li>
          <li>Don&apos;t click the same hero twice!</li>
        </ul>
      </div>
    </div>
  )
}

export default InfoButton
