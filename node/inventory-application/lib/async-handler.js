'use strict';

// Express 5 already forwards rejected promises from async handlers to the
// error middleware. The wrapper is kept so the routes state it explicitly and
// synchronous throws take the same path.
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
