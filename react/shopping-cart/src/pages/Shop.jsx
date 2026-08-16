import { useSearchParams } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts.js'
import { useCart } from '../context/CartContext.jsx'
import ProductCard from '../components/ProductCard.jsx'
import { CATEGORIES } from '../data/categories.js'
import './Shop.css'

function Shop() {
  const { products, loading, error, retry } = useProducts()
  const { addToCart } = useCart()
  const [searchParams, setSearchParams] = useSearchParams()

  const category = searchParams.get('category')
  const filtered = category
    ? products.filter((product) => product.category === category)
    : products

  if (loading) {
    return <p className="shop-status">Loading products…</p>
  }

  if (error) {
    return (
      <div className="shop-status">
        <p>Failed to load products.</p>
        <button type="button" className="shop-status__retry" onClick={retry}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <section className="shop">
      <h1>Shop</h1>

      <div className="shop__filter">
        <button
          type="button"
          className={`shop__chip${!category ? ' shop__chip--active' : ''}`}
          onClick={() => setSearchParams({})}
        >
          All
        </button>
        {CATEGORIES.map((item) => (
          <button
            key={item.slug}
            type="button"
            className={`shop__chip${
              category === item.slug ? ' shop__chip--active' : ''
            }`}
            onClick={() => setSearchParams({ category: item.slug })}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="shop__grid">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} onAdd={addToCart} />
        ))}
      </div>
    </section>
  )
}

export default Shop
