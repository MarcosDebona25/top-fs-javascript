import { useEffect, useRef } from 'react'

function Overlay({ status, score, bestScore, onPlayAgain }) {
  const won = status === 'won'
  const playAgainRef = useRef(null)
  const dialogRef = useRef(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement

    playAgainRef.current?.focus()

    function handleKeyDown(e) {
      if (e.key !== 'Tab') return

      const dialog = dialogRef.current
      if (!dialog) return

      const focusables = dialog.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusables.length === 0) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus()
      }
    }
  }, [])

  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="overlay-title"
      ref={dialogRef}
    >
      <div className={`overlay-card ${won ? 'overlay-card--win' : ''}`}>
        <span className="overlay-burst" aria-hidden="true">
          {won ? 'BAM!' : 'POW!'}
        </span>
        <h2 id="overlay-title" className="overlay-title">
          {won ? 'You win!' : 'Game over'}
        </h2>
        <p className="overlay-text">
          {won
            ? 'You clicked all 15 characters without repeating.'
            : `You clicked a character twice. Final score: ${score}.`}
        </p>
        <p className="overlay-best">Best score: {bestScore}</p>
        <button
          ref={playAgainRef}
          type="button"
          className="play-again"
          onClick={onPlayAgain}
        >
          Play again
        </button>
      </div>
    </div>
  )
}

export default Overlay
