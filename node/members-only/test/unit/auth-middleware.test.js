'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { ensureAuth, ensureGuest, ensureAdmin, canSeeAuthors } = require('../../middleware/auth');
const { passcodeMatches } = require('../../controllers/club');

function fakeRes() {
  return {
    redirectedTo: null,
    statusCode: 200,
    rendered: null,
    redirect(to) { this.redirectedTo = to; return this; },
    status(code) { this.statusCode = code; return this; },
    render(view, locals) { this.rendered = { view, locals }; return this; },
  };
}

function fakeReq(user) {
  return { user, isAuthenticated: () => Boolean(user) };
}

describe('ensureAuth', () => {
  test('lets logged-in users through', () => {
    let called = false;
    ensureAuth(fakeReq({ id: 1 }), fakeRes(), () => { called = true; });
    assert.equal(called, true);
  });

  test('redirects guests to /log-in', () => {
    const res = fakeRes();
    let called = false;
    ensureAuth(fakeReq(null), res, () => { called = true; });
    assert.equal(called, false);
    assert.equal(res.redirectedTo, '/log-in');
  });
});

describe('ensureGuest', () => {
  test('redirects logged-in users home', () => {
    const res = fakeRes();
    ensureGuest(fakeReq({ id: 1 }), res, () => assert.fail('should not continue'));
    assert.equal(res.redirectedTo, '/');
  });

  test('lets guests through', () => {
    let called = false;
    ensureGuest(fakeReq(null), fakeRes(), () => { called = true; });
    assert.equal(called, true);
  });
});

describe('ensureAdmin', () => {
  test('allows admins', () => {
    let called = false;
    ensureAdmin(fakeReq({ id: 1, is_admin: true }), fakeRes(), () => { called = true; });
    assert.equal(called, true);
  });

  test('responds 403 for non-admin members', () => {
    const res = fakeRes();
    ensureAdmin(fakeReq({ id: 1, is_member: true, is_admin: false }), res, () => assert.fail('no'));
    assert.equal(res.statusCode, 403);
    assert.equal(res.rendered.view, 'error');
  });

  test('redirects guests to /log-in', () => {
    const res = fakeRes();
    ensureAdmin(fakeReq(null), res, () => assert.fail('no'));
    assert.equal(res.redirectedTo, '/log-in');
  });
});

describe('canSeeAuthors', () => {
  test('guests and plain users cannot', () => {
    assert.equal(canSeeAuthors(null), false);
    assert.equal(canSeeAuthors({ is_member: false, is_admin: false }), false);
  });

  test('members and admins can', () => {
    assert.equal(canSeeAuthors({ is_member: true }), true);
    assert.equal(canSeeAuthors({ is_admin: true }), true);
  });
});

describe('passcodeMatches', () => {
  test('matches exact passcode only', () => {
    assert.equal(passcodeMatches('abc', 'abc'), true);
    assert.equal(passcodeMatches('abd', 'abc'), false);
  });

  test('never matches when the passcode is not configured', () => {
    assert.equal(passcodeMatches('', undefined), false);
    assert.equal(passcodeMatches('undefined', undefined), false);
  });
});
