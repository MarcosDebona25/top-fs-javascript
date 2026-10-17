const { validationResult, matchedData } = require('express-validator');
const { HttpError, mapErrors } = require('./http');

// Throws 422 with per-field messages; returns only the validated (and sanitized) fields.
function validated(req) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const details = mapErrors(result);
    // Errors from body() itself (no field) come under the empty key.
    if (details['']) {
      details.body = details[''];
      delete details[''];
    }
    throw new HttpError(422, 'Validation failed', details);
  }
  return matchedData(req, { locations: ['body'] });
}

module.exports = { validated };
