'use strict';

const { csrfSync } = require('csrf-sync');

// The token travels in a hidden form field named `_csrf` (see the form partials),
// so the request-side reader takes it from the parsed body. The token itself is
// stored server-side in the anonymous cookie-session.
const { csrfSynchronisedProtection, generateToken } = csrfSync({
  getTokenFromRequest: (req) => (req.body ? req.body._csrf : undefined),
});

module.exports = {
  csrfSynchronisedProtection,
  generateToken,
};
