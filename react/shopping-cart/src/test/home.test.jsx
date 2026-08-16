import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Home from '../pages/Home.jsx'
import { STORE_NAME } from '../data/store.js'

describe('Home', () => {
  it('renders the hero and categories', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: STORE_NAME }),
    ).toBeInTheDocument()
    expect(screen.getByAltText('Galaxy Store logo')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Browse the shop' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Electronics')).toBeInTheDocument()
  })
})
