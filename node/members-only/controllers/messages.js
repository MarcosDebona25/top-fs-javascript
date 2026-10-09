'use strict';

const { listMessages, createMessage, deleteMessage } = require('../db/queries');
const { errorsFor } = require('../validators');
const { canSeeAuthors } = require('../middleware/auth');

async function home(req, res, next) {
  try {
    const showAuthors = canSeeAuthors(req.user);
    const messages = await listMessages({ includeAuthor: showAuthors });
    res.render('index', { messages, showAuthors });
  } catch (err) {
    next(err);
  }
}

function newForm(req, res) {
  res.render('new-message', { errors: {}, values: {} });
}

async function create(req, res, next) {
  try {
    const { title, text } = req.body;
    const errors = errorsFor(req);
    if (errors) return res.status(422).render('new-message', { errors, values: { title, text } });
    await createMessage({ title, text, userId: req.user.id });
    req.flash('success', 'Message posted.');
    return res.redirect('/');
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(404).render('error', { message: 'Message not found.' });
    }
    await deleteMessage(id);
    req.flash('success', 'Message deleted.');
    return res.redirect('/');
  } catch (err) {
    return next(err);
  }
}

module.exports = { home, newForm, create, remove };
