'use strict';

class HttpError extends Error {
  constructor(statusCode, message, options = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.status = statusCode;
    this.details = options.details || null;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends HttpError {
  constructor(message, options) {
    super(400, message, options);
  }
}

class ForbiddenError extends HttpError {
  constructor(message, options) {
    super(403, message, options);
  }
}

class NotFoundError extends HttpError {
  constructor(message = 'The requested resource was not found.', options) {
    super(404, message, options);
  }
}

class ConflictError extends HttpError {
  constructor(message, options) {
    super(409, message, options);
  }
}

class UnprocessableError extends HttpError {
  constructor(message, options) {
    super(422, message, options);
  }
}

module.exports = {
  HttpError,
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  UnprocessableError,
};
