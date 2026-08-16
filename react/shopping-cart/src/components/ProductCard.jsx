import { useState } from 'react'
import { MAX_QUANTITY } from '../data/constants.js'
import './ProductCard.css'

function ProductCard({ product, onAdd }) {
  const [quantity, setQuantity] = useState(1)

  const clamp = (value) => Math.min(MAX_QUANTITY, Math.max(1, value))

  const handleAdd = () => {
    onAdd(product, quantity)
    setQuantity(1)
  }

  return (
    <article className="product-card">
      <img
        className="product-card__image"
        src={product.image}
        alt={product.name}
      />
      <div className="product-card__body">
        <h3 className="product-card__name">{product.name}</h3>
        <p className="product-card__price">
          Unit price: ${product.price.toFixed(2)}
        </p>
        <div className="product-card__stepper">
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
          >
            +
          </button>
          <input
            type="number"
            min="1"
            max={MAX_QUANTITY}
            value={quantity}
            aria-label="Quantity"
            onChange={(e) => setQuantity(clamp(Number(e.target.value) || 1))}
          />
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQuantity((q) => clamp(q - 1))}
          >
            −
          </button>
        </div>
        <p className="product-card__total">
          Total: ${(product.price * quantity).toFixed(2)}
        </p>
        <button
          type="button"
          className="product-card__add"
          aria-label="Add to cart"
          onClick={handleAdd}
        >
          Add to cart
        </button>
      </div>
    </article>
  )
}

export default ProductCard
