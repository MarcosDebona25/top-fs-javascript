import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { CartProvider, useCart } from '../context/CartContext.jsx'
import { STORE_NAME } from '../data/store.js'

function SeedButton() {
  const { addToCart } = useCart()
  const product = { id: 1, name: 'Test Product', image: 'img.png', price: 10 }
  return <button onClick={() => addToCart(product, 2)}>seed cart</button>
}

function renderNavbar() {
  return render(
    <CartProvider>
      <MemoryRouter>
        <Navbar />
        <SeedButton />
      </MemoryRouter>
    </CartProvider>,
  )
}

describe('Navbar', () => {
  it('renders the brand and nav links', () => {
    renderNavbar()

    expect(screen.getByRole('link', { name: STORE_NAME })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Shop' })).toBeInTheDocument()
  })

  it('hides the badge when the cart is empty', () => {
    renderNavbar()

    expect(screen.queryByTestId('cart-badge')).toBeNull()
  })

  it('shows the item count badge after adding items', async () => {
    const user = userEvent.setup()
    renderNavbar()

    await user.click(screen.getByRole('button', { name: 'seed cart' }))

    const badge = screen.getByTestId('cart-badge')
    expect(badge).toBeInTheDocument()
    expect(badge.textContent).toBe('2')
  })
})
