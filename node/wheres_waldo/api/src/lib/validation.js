const { validationResult, matchedData } = require('express-validator');
const { HttpError, mapErrors } = require('./http');

// Throws 422 with per-field messages; returns only the validated (and sanitized) fields.
function validated(req) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    throw new HttpError(422, 'Validation failed', { errors: mapErrors(result) });
  }
  return matchedData(req, { locations: ['body', 'query'] });
}

module.exports = { validated };
