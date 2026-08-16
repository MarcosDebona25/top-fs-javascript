import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { CartProvider, useCart } from '../context/CartContext.jsx'

const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>

describe('CartContext', () => {
  it('adds a new item', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    const product = { id: 1, name: 'Test Product', image: 'img.png', price: 10 }

    act(() => result.current.addToCart(product, 2))

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0]).toMatchObject({
      id: 1,
      quantity: 2,
      unitPrice: 10,
    })
  })

  it('increments quantity when adding the same id', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    const product = { id: 1, name: 'Test Product', image: 'img.png', price: 10 }

    act(() => result.current.addToCart(product, 2))
    act(() => result.current.addToCart(product, 3))

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(5)
  })

  it('clamps quantity to a minimum of 1 on update', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    const product = { id: 1, name: 'Test Product', image: 'img.png', price: 10 }

    act(() => result.current.addToCart(product, 1))
    act(() => result.current.updateQuantity(1, 0))

    expect(result.current.items[0].quantity).toBe(1)
  })

  it('removes an item', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    const product = { id: 1, name: 'Test Product', image: 'img.png', price: 10 }

    act(() => result.current.addToCart(product, 1))
    act(() => result.current.removeFromCart(1))

    expect(result.current.items).toHaveLength(0)
  })

  it('computes totalItems and totalPrice correctly', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    const a = { id: 1, name: 'A', image: 'a.png', price: 10 }
    const b = { id: 2, name: 'B', image: 'b.png', price: 5 }

    act(() => result.current.addToCart(a, 2))
    act(() => result.current.addToCart(b, 3))

    expect(result.current.totalItems).toBe(5)
    expect(result.current.totalPrice).toBe(35)
  })
})
