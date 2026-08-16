import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Cart from '../pages/Cart.jsx'
import { CartProvider, useCart } from '../context/CartContext.jsx'
import { useEffect } from 'react'

function SeedCart() {
  const { addToCart } = useCart()
  useEffect(() => {
    addToCart({ id: 1, name: 'Seed Product', image: 'img.png', price: 10 }, 2)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

function renderCart() {
  return render(
    <CartProvider>
      <MemoryRouter>
        <SeedCart />
        <Cart />
      </MemoryRouter>
    </CartProvider>,
  )
}

describe('Cart', () => {
  it('renders the empty state', () => {
    render(
      <CartProvider>
        <MemoryRouter>
          <Cart />
        </MemoryRouter>
      </CartProvider>,
    )

    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Browse products' }),
    ).toBeInTheDocument()
  })

  it('renders items and a disabled checkout button', async () => {
    renderCart()

    expect(await screen.findByText('Seed Product')).toBeInTheDocument()
    expect(screen.getByTestId('cart-item-quantity').textContent).toBe('2')
    expect(screen.getByText('Total: $20.00')).toBeInTheDocument()

    const checkout = screen.getByRole('button', {
      name: 'Checkout (coming soon)',
    })
    expect(checkout).toBeDisabled()
  })
})
