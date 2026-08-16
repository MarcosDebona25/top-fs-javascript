import { Link, NavLink } from 'react-router-dom'
import { STORE_NAME } from '../data/store.js'
import { useCart } from '../context/CartContext.jsx'
import cartIcon from '../assets/icons8-cart-windows-10/icons8-cart-32.png'
import './Navbar.css'

function Navbar() {
  const { totalItems } = useCart()

  return (
    <header className="navbar">
      <div className="navbar__left">
        <Link to="/" className="navbar__brand">
          {STORE_NAME}
        </Link>
        <nav className="navbar__nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            Home
          </NavLink>
          <NavLink
            to="/shop"
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            Shop
          </NavLink>
        </nav>
      </div>
      <Link
        to="/cart"
        className="navbar__cart"
        aria-label={totalItems > 0 ? `Cart with ${totalItems} items` : 'Cart'}
      >
        <img className="navbar__cart-icon" src={cartIcon} alt="" />
        {totalItems > 0 && (
          <span className="navbar__badge" data-testid="cart-badge">
            {totalItems}
          </span>
        )}
      </Link>
    </header>
  )
}

export default Navbar
