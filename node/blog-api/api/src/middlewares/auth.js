const passport = require('../config/passport');
const { HttpError } = require('../lib/http');

function authenticateJwt(req, res, next) {
  passport.authenticate('jwt', { session: false }, (error, user, info) => {
    if (error) return next(error);
    if (!user) return next(new HttpError(401, 'Authentication required'));
    req.user = user;
    req.tokenExpiresAt = new Date(info.exp * 1000).toISOString();
    return next();
  })(req, res, next);
}

// 401 without a valid token.
const requireAuth = authenticateJwt;

// Anonymous when there is no cookie; a cookie that fails verification is still a 401.
function optionalAuth(req, res, next) {
  if (!req.cookies || !req.cookies.token) return next();
  return authenticateJwt(req, res, next);
}

// 403 when the user is authenticated but lacks the role. Use after requireAuth.
function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) return next(new HttpError(403, 'Forbidden'));
    return next();
  };
}

module.exports = { requireAuth, optionalAuth, requireRole };
