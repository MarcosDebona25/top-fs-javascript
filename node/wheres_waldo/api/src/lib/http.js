class HttpError extends Error {
  // options.errors: per-field messages for inline form errors; options.code: stable machine-readable
  // reason; options.extra: more fields merged into the response body.
  constructor(status, message, options = {}) {
    super(message);
    this.status = status;
    this.errors = options.errors;
    this.code = options.code;
    this.extra = options.extra;
  }
}

function mapErrors(result) {
  const errors = {};
  for (const [field, error] of Object.entries(result.mapped())) {
    errors[field] = error.msg;
  }
  return errors;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// A malformed id can never match a game, so it answers like a missing one.
function parseUuid(value) {
  if (!UUID.test(value)) throw new HttpError(404, 'Game not found');
  return value.toLowerCase();
}

module.exports = { HttpError, mapErrors, parseUuid };
