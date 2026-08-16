import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Shop from '../pages/Shop.jsx'
import { CartProvider } from '../context/CartContext.jsx'

const apiProducts = [
  { id: 1, title: 'API Title One', price: 10, category: 'x', image: 'api.png' },
  { id: 2, title: 'API Title Two', price: 20, category: 'y', image: 'api2.png' },
]

function renderShop() {
  return render(
    <CartProvider>
      <MemoryRouter>
        <Shop />
      </MemoryRouter>
    </CartProvider>,
  )
}

describe('Shop', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders product cards using local catalog names on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => apiProducts,
      }),
    )

    renderShop()

    expect(await screen.findByText('Fjällräven Backpack')).toBeInTheDocument()
    expect(screen.getByText('Casual Slim Fit T-Shirt')).toBeInTheDocument()
  })

  it('shows an error message when the fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))

    renderShop()

    expect(
      await screen.findByText('Failed to load products.'),
    ).toBeInTheDocument()
  })

  it('filters products by category chip', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { id: 1, title: 'Backpack', price: 10, category: 'electronics', image: '' },
          { id: 5, title: 'Bracelet', price: 40, category: 'jewelery', image: '' },
        ],
      }),
    )

    renderShop()

    expect(await screen.findByText('Fjällräven Backpack')).toBeInTheDocument()
    expect(
      screen.getByText('Gold & Silver Dragon Bracelet'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Electronics' }))

    expect(screen.getByText('Fjällräven Backpack')).toBeInTheDocument()
    expect(screen.queryByText('Gold & Silver Dragon Bracelet')).toBeNull()
  })
})
