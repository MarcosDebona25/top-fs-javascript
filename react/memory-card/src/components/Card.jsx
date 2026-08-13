function Card({ card, onClick }) {
  return (
    <button type="button" className="card" onClick={() => onClick(card)}>
      <img src={card.image} alt="" className="card-image" />
      <span className="card-name">{card.name}</span>
    </button>
  )
}

export default Card
