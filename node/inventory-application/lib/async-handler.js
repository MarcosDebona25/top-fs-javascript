'use strict';

// Express 5 does not forward rejected promises from async handlers to the error
// middleware, so each handler is wrapped explicitly.
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
