'use strict';

const FLASH_KEY = 'flash';

function setFlash(req, type, message) {
  req.session.flash = { type, message };
}

function flashMiddleware(req, res, next) {
  res.locals.flash = req.session[FLASH_KEY] || null;
  delete req.session[FLASH_KEY];
  next();
}

module.exports = { setFlash, flashMiddleware, FLASH_KEY };
