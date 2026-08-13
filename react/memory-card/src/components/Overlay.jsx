function Overlay({ status, score, bestScore, onPlayAgain }) {
  const won = status === 'won'

  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="overlay-card">
        <h2 className="overlay-title">{won ? 'You win!' : 'Game over'}</h2>
        <p className="overlay-text">
          {won
            ? 'You clicked all 15 cards without repeating.'
            : `You clicked a card twice. Final score: ${score}.`}
        </p>
        <p className="overlay-best">Best score: {bestScore}</p>
        <button type="button" className="play-again" onClick={onPlayAgain}>
          Play again
        </button>
      </div>
    </div>
  )
}

export default Overlay
