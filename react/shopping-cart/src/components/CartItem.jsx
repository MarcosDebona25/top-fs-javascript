import './CartItem.css'

function CartItem({ item, onUpdateQuantity, onRemove }) {
  return (
    <div className="cart-item">
      <img className="cart-item__image" src={item.image} alt={item.name} />
      <div className="cart-item__info">
        <h3 className="cart-item__name">{item.name}</h3>
        <p className="cart-item__price">
          Unit price: ${item.unitPrice.toFixed(2)}
        </p>
      </div>
      <div className="cart-item__stepper">
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
        >
          +
        </button>
        <span className="cart-item__qty" data-testid="cart-item-quantity">
          {item.quantity}
        </span>
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
        >
          −
        </button>
      </div>
      <p className="cart-item__total">
        ${(item.unitPrice * item.quantity).toFixed(2)}
      </p>
      <button
        type="button"
        className="cart-item__remove"
        aria-label="Remove"
        onClick={() => onRemove(item.id)}
      >
        Remove
      </button>
    </div>
  )
}

export default CartItem
