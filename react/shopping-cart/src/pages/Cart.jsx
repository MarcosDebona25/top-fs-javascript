import { Link } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import CartItem from '../components/CartItem.jsx'
import './Cart.css'

function Cart() {
  const { items, totalPrice, updateQuantity, removeFromCart } = useCart()

  if (items.length === 0) {
    return (
      <section className="cart cart--empty">
        <ShoppingCart className="cart__empty-icon" aria-hidden="true" />
        <p>Your cart is empty.</p>
        <p className="cart__empty-sub">
          Add something you love and it'll show up right here.
        </p>
        <Link to="/shop" className="cart__empty-cta">
          Browse products
        </Link>
      </section>
    )
  }

  return (
    <section className="cart">
      <h1>Cart</h1>
      <ul className="cart__list">
        {items.map((item) => (
          <li key={item.id}>
            <CartItem
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeFromCart}
            />
          </li>
        ))}
      </ul>
      <div className="cart__summary">
        <p className="cart__total">Total: ${totalPrice.toFixed(2)}</p>
        <button
          type="button"
          className="cart__checkout"
          disabled
          title="Checkout is not implemented yet. Coming soon."
          aria-label="Checkout (coming soon)"
        >
          Checkout
        </button>
      </div>
    </section>
  )
}

export default Cart
