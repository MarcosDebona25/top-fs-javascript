import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { Pagination, pageWindow } from './Pagination.jsx';

const labels = (page, total) => pageWindow(page, total).map((item) => (item.gap ? '…' : item.page));

describe('pageWindow', () => {
  it('lists every page when there are few', () => {
    expect(labels(1, 3)).toEqual([1, 2, 3]);
  });

  it('keeps the first, the last and the neighbours, with gaps between', () => {
    expect(labels(10, 20)).toEqual([1, '…', 9, 10, 11, '…', 20]);
  });

  it('shows the first pages together near the start and the last near the end', () => {
    expect(labels(1, 20)).toEqual([1, 2, 3, 4, '…', 20]);
    expect(labels(20, 20)).toEqual([1, '…', 17, 18, 19, 20]);
  });
});

describe('<Pagination>', () => {
  const renderIt = (page, totalPages) =>
    render(
      <MemoryRouter>
        <Pagination page={page} totalPages={totalPages} hrefFor={(target) => `/ranking?page=${target}`} />
      </MemoryRouter>,
    );

  it('renders nothing for a single page', () => {
    const { container } = renderIt(1, 1);
    expect(container).toBeEmptyDOMElement();
  });

  it('marks the current page and disables Previous on the first one', () => {
    renderIt(1, 5);
    expect(screen.getByRole('link', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Previous')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute('href', '/ranking?page=2');
  });

  it('links Previous and Next in the middle', () => {
    renderIt(3, 5);
    expect(screen.getByRole('link', { name: 'Previous' })).toHaveAttribute('href', '/ranking?page=2');
    expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute('href', '/ranking?page=4');
  });

  it('disables Next on the last page', () => {
    renderIt(5, 5);
    expect(screen.getByText('Next')).toHaveAttribute('aria-disabled', 'true');
  });
});
