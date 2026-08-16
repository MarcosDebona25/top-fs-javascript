import { useEffect, useState } from 'react'
import { getProductMeta } from '../data/products.js'

const PRODUCTS_URL = 'https://fakestoreapi.com/products'

export function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reload, setReload] = useState(0)

  const retry = () => {
    setLoading(true)
    setError(null)
    setReload((count) => count + 1)
  }

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch(PRODUCTS_URL)
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }
        const data = await response.json()
        if (cancelled) return
        const merged = data.map((item) => {
          const meta = getProductMeta(item.id)
          return {
            id: item.id,
            price: item.price,
            category: item.category,
            name: meta?.name ?? item.title,
            image: meta?.image ?? item.image,
          }
        })
        setProducts(merged)
      } catch (err) {
        if (!cancelled) setError(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [reload])

  return { products, loading, error, retry }
}
