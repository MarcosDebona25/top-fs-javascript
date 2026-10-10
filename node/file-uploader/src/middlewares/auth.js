function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.redirect('/log-in');
}

function ensureGuest(req, res, next) {
  if (!req.isAuthenticated()) return next();
  return res.redirect('/');
}

module.exports = { ensureAuthenticated, ensureGuest };
