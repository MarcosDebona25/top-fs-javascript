import { Link } from 'react-router-dom'
import { Monitor, Shirt, Gem } from 'lucide-react'
import { CATEGORIES } from '../data/categories.js'
import { STORE_NAME } from '../data/store.js'
import logo from '../assets/logo/icons8-online-store-80.png'
import './Home.css'

const CATEGORY_ICONS = {
  electronics: Monitor,
  "women's clothing": Shirt,
  "men's clothing": Shirt,
  jewelery: Gem,
}

const VALUE_PROPS = [
  {
    title: 'Quality',
    description: 'Every item is handpicked for durability and value.',
  },
  {
    title: 'Fast shipping',
    description: 'Orders leave quickly and arrive right on time.',
  },
  {
    title: 'Support',
    description: 'Real humans ready to help with anything.',
  },
]

function Home() {
  return (
    <section className="home">
      <div className="hero">
        <div className="hero__decor" aria-hidden="true" />
        <div className="hero__logo-chip">
          <img className="hero__logo" src={logo} alt="Galaxy Store logo" />
        </div>
        <h1>{STORE_NAME}</h1>
        <p className="hero__sub">
          One clean store for fashion, jewelry, and tech, handpicked so you
          find what you need.
        </p>
        <div className="hero__actions">
          <Link to="/shop" className="hero__cta">
            Browse the shop
          </Link>
          <Link to="/shop" className="hero__ghost">
            Shop by category
          </Link>
        </div>
      </div>

      <section className="categories">
        <h2>Shop by category</h2>
        <div className="categories__grid">
          {CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICONS[category.slug] ?? Monitor
            return (
              <Link
                key={category.slug}
                to={`/shop?category=${category.slug}`}
                className="category-tile"
              >
                <span className="category-tile__icon">
                  <Icon size={28} aria-hidden="true" />
                </span>
                <span className="category-tile__label">{category.label}</span>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="value-props">
        {VALUE_PROPS.map(({ title, description }) => (
          <div key={title} className="value-prop">
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
        ))}
      </section>
    </section>
  )
}

export default Home
