import { useState } from 'react'
import cards from './cards.js'
import Header from './components/Header.jsx'
import CardGrid from './components/CardGrid.jsx'
import Overlay from './components/Overlay.jsx'
import Footer from './components/Footer.jsx'
import InfoButton from './components/InfoButton.jsx'
import './App.css'

function shuffle(array) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function App() {
  const [deck, setDeck] = useState(() => shuffle(cards))
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [clickedIds, setClickedIds] = useState(() => new Set())
  const [status, setStatus] = useState('playing') // 'playing' | 'won' | 'lost'

  function handleCardClick(card) {
    if (status !== 'playing') return

    if (clickedIds.has(card.id)) {
      setBestScore((best) => Math.max(best, score))
      setStatus('lost')
      return
    }

    const nextScore = score + 1
    const nextClicked = new Set(clickedIds)
    nextClicked.add(card.id)

    if (nextScore === cards.length) {
      setScore(nextScore)
      setBestScore((best) => Math.max(best, nextScore))
      setStatus('won')
      return
    }

    setScore(nextScore)
    setClickedIds(nextClicked)
    setDeck(shuffle(cards))
  }

  function handlePlayAgain() {
    setScore(0)
    setClickedIds(new Set())
    setDeck(shuffle(cards))
    setStatus('playing')
  }

  function handleReset() {
    setScore(0)
    setBestScore(0)
    setClickedIds(new Set())
    setDeck(shuffle(cards))
    setStatus('playing')
  }

  return (
    <div className="app">
      <Header score={score} bestScore={bestScore} onReset={handleReset} />

      <main className="board">
        <CardGrid cards={deck} onCardClick={handleCardClick} />
      </main>

      <Footer />
      <InfoButton />

      {status !== 'playing' && (
        <Overlay
          status={status}
          score={score}
          bestScore={bestScore}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  )
}

export default App
