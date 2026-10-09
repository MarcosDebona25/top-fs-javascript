'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const Rules = require('../../shared/rules');

describe('validatePassword', () => {
  test('accepts a password with 8+ chars, an uppercase letter and a digit', () => {
    assert.equal(Rules.validatePassword('Abcdefg1'), null);
  });

  test('rejects an empty password', () => {
    assert.match(Rules.validatePassword(''), /required/i);
  });

  test('rejects fewer than 8 characters', () => {
    assert.match(Rules.validatePassword('Abc1'), /8 characters/i);
  });

  test('rejects a password without an uppercase letter', () => {
    assert.match(Rules.validatePassword('abcdefg1'), /uppercase/i);
  });

  test('rejects a password without a number', () => {
    assert.match(Rules.validatePassword('Abcdefgh'), /number/i);
  });

  test('rejects more than 72 bytes (bcrypt limit)', () => {
    assert.match(Rules.validatePassword('A1' + 'x'.repeat(71)), /72/);
    assert.equal(Rules.validatePassword('A1' + 'x'.repeat(70)), null);
  });

  test('counts bytes, not characters, for multibyte input', () => {
    // 'ñ' is 2 bytes in UTF-8: 36 of them + 'A1' = 74 bytes.
    assert.match(Rules.validatePassword('A1' + 'ñ'.repeat(36)), /72/);
  });

  test('requirements list drives the live checklist', () => {
    const status = (v) => Object.fromEntries(Rules.PASSWORD_REQUIREMENTS.map((r) => [r.id, r.test(v)]));
    assert.deepEqual(status('abc'), { length: false, upper: false, digit: false });
    assert.deepEqual(status('Abcdefg1'), { length: true, upper: true, digit: true });
  });
});

describe('validateConfirm', () => {
  test('passes when equal', () => assert.equal(Rules.validateConfirm('Abcdefg1', 'Abcdefg1'), null));
  test('fails when different', () => assert.match(Rules.validateConfirm('Abcdefg1', 'Abcdefg2'), /do not match/i));
  test('fails when empty', () => assert.match(Rules.validateConfirm('Abcdefg1', ''), /confirm/i));
});

describe('validateEmail', () => {
  test('accepts a normal address', () => assert.equal(Rules.validateEmail('ada@example.com'), null));
  test('trims surrounding whitespace', () => assert.equal(Rules.validateEmail('  ada@example.com '), null));
  test('rejects empty', () => assert.match(Rules.validateEmail(''), /required/i));
  test('rejects missing @', () => assert.match(Rules.validateEmail('ada.example.com'), /valid/i));
  test('rejects missing domain dot', () => assert.match(Rules.validateEmail('ada@example'), /valid/i));
  test('rejects over 254 chars', () => {
    assert.match(Rules.validateEmail('a'.repeat(250) + '@b.co'), /valid/i);
  });
});

describe('names, title and text', () => {
  test('first/last name: required and max 50', () => {
    assert.match(Rules.validateFirstName('   '), /required/i);
    assert.equal(Rules.validateFirstName('A'.repeat(50)), null);
    assert.match(Rules.validateLastName('A'.repeat(51)), /50/);
  });

  test('title: required and max 100', () => {
    assert.match(Rules.validateTitle(''), /required/i);
    assert.equal(Rules.validateTitle('T'.repeat(100)), null);
    assert.match(Rules.validateTitle('T'.repeat(101)), /100/);
  });

  test('text: required and max 1000', () => {
    assert.match(Rules.validateText(' '), /required/i);
    assert.equal(Rules.validateText('x'.repeat(1000)), null);
    assert.match(Rules.validateText('x'.repeat(1001)), /1000/);
  });

  test('passcode: required', () => {
    assert.match(Rules.validatePasscode('  '), /required/i);
    assert.equal(Rules.validatePasscode('secret'), null);
  });

  test('handles null/undefined without throwing', () => {
    assert.ok(Rules.validateFirstName(undefined));
    assert.ok(Rules.validateEmail(null));
    assert.ok(Rules.validatePassword(undefined));
  });
});
