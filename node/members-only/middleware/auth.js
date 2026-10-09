'use strict';

function ensureAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.redirect('/log-in');
}

function ensureGuest(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return res.redirect('/');
  return next();
}

// Real server-side check: hiding the delete button is not security.
function ensureAdmin(req, res, next) {
  if (!(req.isAuthenticated && req.isAuthenticated())) return res.redirect('/log-in');
  if (!req.user.is_admin) return res.status(403).render('error', { message: 'Admins only.' });
  return next();
}

// Members and admins may see message authors and dates.
function canSeeAuthors(user) {
  return Boolean(user && (user.is_member || user.is_admin));
}

module.exports = { ensureAuth, ensureGuest, ensureAdmin, canSeeAuthors };
