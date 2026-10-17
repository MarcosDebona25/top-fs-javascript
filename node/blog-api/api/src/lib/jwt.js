const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN, JWT_ISSUER, JWT_AUDIENCE } = require('./env');

// Only the id (sub) and the role travel in the token: it is signed, not encrypted.
function signAccessToken(user) {
  const token = jwt.sign({ role: user.role }, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: JWT_EXPIRES_IN,
    subject: String(user.id),
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
  const expiresAtMs = jwt.decode(token).exp * 1000;
  return { token, expiresAt: new Date(expiresAtMs).toISOString(), maxAge: expiresAtMs - Date.now() };
}

module.exports = { signAccessToken };
