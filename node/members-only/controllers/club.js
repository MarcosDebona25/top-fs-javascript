'use strict';

const { makeMember, makeAdmin } = require('../db/queries');
const { errorsFor } = require('../validators');

// Passcodes live in the environment, never in the database or the repo.
function passcodeMatches(input, expected) {
  return Boolean(expected) && String(input) === String(expected);
}

function joinForm(req, res) {
  res.render('passcode', {
    heading: 'Join the club',
    blurb: 'Enter the secret passcode to see who wrote what.',
    action: '/join-club',
    error: null,
  });
}

async function join(req, res, next) {
  try {
    const errors = errorsFor(req);
    const view = {
      heading: 'Join the club',
      blurb: 'Enter the secret passcode to see who wrote what.',
      action: '/join-club',
    };
    if (errors) return res.status(422).render('passcode', { ...view, error: errors.passcode });
    if (!passcodeMatches(req.body.passcode, process.env.MEMBER_PASSCODE)) {
      return res.status(403).render('passcode', { ...view, error: 'That is not the passcode. Try again.' });
    }
    await makeMember(req.user.id);
    req.flash('success', 'Welcome to the club. You can now see who wrote what.');
    return res.redirect('/');
  } catch (err) {
    return next(err);
  }
}

function adminForm(req, res) {
  res.render('passcode', {
    heading: 'Become an admin',
    blurb: 'Enter the admin passcode to be able to delete messages.',
    action: '/become-admin',
    error: null,
  });
}

async function becomeAdmin(req, res, next) {
  try {
    const errors = errorsFor(req);
    const view = {
      heading: 'Become an admin',
      blurb: 'Enter the admin passcode to be able to delete messages.',
      action: '/become-admin',
    };
    if (errors) return res.status(422).render('passcode', { ...view, error: errors.passcode });
    if (!passcodeMatches(req.body.passcode, process.env.ADMIN_PASSCODE)) {
      return res.status(403).render('passcode', { ...view, error: 'That is not the passcode. Try again.' });
    }
    await makeAdmin(req.user.id);
    req.flash('success', 'You are now an admin.');
    return res.redirect('/');
  } catch (err) {
    return next(err);
  }
}

module.exports = { joinForm, join, adminForm, becomeAdmin, passcodeMatches };
