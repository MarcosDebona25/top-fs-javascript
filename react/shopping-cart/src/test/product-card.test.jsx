import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProductCard from '../components/ProductCard.jsx'

const product = { id: 1, name: 'Test Product', image: 'img.png', price: 10.5 }

describe('ProductCard', () => {
  it('increments and decrements quantity, staying at a minimum of 1', async () => {
    const user = userEvent.setup()
    render(<ProductCard product={product} onAdd={() => {}} />)

    const input = screen.getByRole('spinbutton')
    expect(input.value).toBe('1')

    await user.click(screen.getByRole('button', { name: 'Increase quantity' }))
    expect(input.value).toBe('2')

    await user.click(screen.getByRole('button', { name: 'Decrease quantity' }))
    expect(input.value).toBe('1')

    await user.click(screen.getByRole('button', { name: 'Decrease quantity' }))
    expect(input.value).toBe('1')
  })

  it('updates quantity from the input', () => {
    render(<ProductCard product={product} onAdd={() => {}} />)

    const input = screen.getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '3' } })

    expect(input.value).toBe('3')
    expect(screen.getByText('Total: $31.50')).toBeInTheDocument()
  })

  it('calls onAdd with product and quantity then resets quantity', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    render(<ProductCard product={product} onAdd={onAdd} />)

    await user.click(screen.getByRole('button', { name: 'Increase quantity' }))
    await user.click(screen.getByRole('button', { name: 'Add to cart' }))

    expect(onAdd).toHaveBeenCalledWith(product, 2)
    expect(screen.getByRole('spinbutton').value).toBe('1')
  })
})
