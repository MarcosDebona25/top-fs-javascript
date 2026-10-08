'use strict';

const PER_PAGE = 20;

function paginate({ page = 1, total = 0, perPage = PER_PAGE }) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(Math.max(1, page), totalPages);
  return {
    page: current,
    perPage,
    total,
    totalPages,
    hasPrev: current > 1,
    hasNext: current < totalPages,
  };
}

module.exports = { paginate, PER_PAGE };
