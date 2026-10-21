import { Link } from 'react-router';

// 1 … 4 5 6 … 20, always with the first, the last and the neighbours of the current page.
export function pageWindow(page, totalPages) {
  const wanted = new Set([1, totalPages, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((value) => wanted.add(value));
  if (page >= totalPages - 2) [totalPages - 1, totalPages - 2, totalPages - 3].forEach((value) => wanted.add(value));
  const pages = [...wanted].filter((value) => value >= 1 && value <= totalPages).sort((a, b) => a - b);
  const items = [];
  pages.forEach((value, index) => {
    if (index > 0 && value - pages[index - 1] > 1) items.push({ gap: true, key: `gap-${value}` });
    items.push({ page: value, key: value });
  });
  return items;
}

export function Pagination({ page, totalPages, hrefFor }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Pagination">
      {page > 1 ? (
        <Link to={hrefFor(page - 1)} className="pagination__item" rel="prev">
          Previous
        </Link>
      ) : (
        <span className="pagination__item is-disabled" aria-disabled="true">
          Previous
        </span>
      )}
      {pageWindow(page, totalPages).map((item) =>
        item.gap ? (
          <span key={item.key} className="pagination__gap" aria-hidden="true">
            …
          </span>
        ) : (
          <Link
            key={item.key}
            to={hrefFor(item.page)}
            className={`pagination__item${item.page === page ? ' is-current' : ''}`}
            aria-current={item.page === page ? 'page' : undefined}
            aria-label={`Page ${item.page}`}
          >
            {item.page}
          </Link>
        )
      )}
      {page < totalPages ? (
        <Link to={hrefFor(page + 1)} className="pagination__item" rel="next">
          Next
        </Link>
      ) : (
        <span className="pagination__item is-disabled" aria-disabled="true">
          Next
        </span>
      )}
    </nav>
  );
}
