class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const MAX_INT4 = 2147483647;

function parseId(value) {
  if (!/^\d{1,10}$/.test(value)) throw new HttpError(404, 'Not found');
  const id = Number(value);
  if (id < 1 || id > MAX_INT4) throw new HttpError(404, 'Not found');
  return id;
}

function mapErrors(result) {
  const errors = {};
  for (const [field, error] of Object.entries(result.mapped())) {
    errors[field] = error.msg;
  }
  return errors;
}

module.exports = { HttpError, parseId, mapErrors };
