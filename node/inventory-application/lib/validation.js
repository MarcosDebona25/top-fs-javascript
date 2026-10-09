'use strict';

// Wraps a validation check that queries the database. The check resolves to
// an error message (invalid) or a falsy value (valid). When the query itself
// fails, the failure is kept aside and reported by failOnValidationFault as a
// real error, so database messages never end up as field errors.
function dbRule(check) {
  return async (value, { req }) => {
    let message;
    try {
      message = await check(value, req);
    } catch (err) {
      req.validationFault = req.validationFault || err;
      return true;
    }
    if (message) throw new Error(message);
    return true;
  };
}

// Appended after the rules that use dbRule.
function failOnValidationFault(req, res, next) {
  next(req.validationFault);
}

module.exports = { dbRule, failOnValidationFault };
