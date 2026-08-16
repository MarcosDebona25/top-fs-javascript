import { createContext, useContext, useMemo, useReducer } from 'react'
import { MAX_QUANTITY } from '../data/constants.js'

const CartContext = createContext(null)

const initialState = { items: [] }

function cartReducer(state, action) {
  switch (action.type) {
    case 'add': {
      const { product, quantity } = action.payload
      const existing = state.items.find((item) => item.id === product.id)
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.id === product.id
              ? {
                  ...item,
                  quantity: Math.min(MAX_QUANTITY, item.quantity + quantity),
                }
              : item,
          ),
        }
      }
      return {
        items: [
          ...state.items,
          {
            id: product.id,
            name: product.name,
            image: product.image,
            unitPrice: product.price,
            quantity: Math.min(MAX_QUANTITY, quantity),
          },
        ],
      }
    }
    case 'remove':
      return {
        items: state.items.filter((item) => item.id !== action.payload.id),
      }
    case 'updateQuantity': {
      const { id, quantity } = action.payload
      return {
        items: state.items.map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: Math.min(MAX_QUANTITY, Math.max(1, quantity)),
              }
            : item,
        ),
      }
    }
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  const value = useMemo(() => {
    const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0)
    const totalPrice = state.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    )
    return {
      items: state.items,
      totalItems,
      totalPrice,
      addToCart: (product, quantity) =>
        dispatch({ type: 'add', payload: { product, quantity } }),
      removeFromCart: (id) => dispatch({ type: 'remove', payload: { id } }),
      updateQuantity: (id, quantity) =>
        dispatch({ type: 'updateQuantity', payload: { id, quantity } }),
    }
  }, [state.items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
