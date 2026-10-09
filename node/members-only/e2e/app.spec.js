'use strict';

const { test, expect } = require('@playwright/test');

const PASSWORD = 'Abcdefg1';
let counter = 0;
const uniqueEmail = () => `user${Date.now()}_${counter++}@example.com`;

async function fillSignUp(page, { first = 'Ada', last = 'Lovelace', email, password = PASSWORD, confirm = PASSWORD }) {
  await page.goto('/sign-up');
  await page.getByLabel('First name').fill(first);
  await page.getByLabel('Last name').fill(last);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password').fill(confirm);
}

async function register(page, email, names = {}) {
  await fillSignUp(page, { email, ...names });
  await page.getByRole('button', { name: 'Sign up' }).click();
  await expect(page).toHaveURL(/\/log-in$/);
}

async function login(page, email, password = PASSWORD) {
  await page.goto('/log-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
}

test.describe('inline validation (sign-up)', () => {
  test('password checklist ticks live and submit follows validity', async ({ page }) => {
    await page.goto('/sign-up');
    const list = page.locator('#password-checklist');
    const submit = page.getByRole('button', { name: 'Sign up' });
    const pw = page.getByLabel('Password', { exact: true });

    await pw.fill('abcdefgh');
    await expect(list.locator('[data-req="length"]')).toHaveClass(/ok/);
    await expect(list.locator('[data-req="upper"]')).toHaveClass(/bad/);
    await expect(list.locator('[data-req="digit"]')).toHaveClass(/bad/);
    await expect(page.locator('[data-error-for="password"]')).toContainText(/uppercase/i);

    await pw.fill('Abcdefgh');
    await expect(list.locator('[data-req="upper"]')).toHaveClass(/ok/);
    await expect(page.locator('[data-error-for="password"]')).toContainText(/number/i);

    await pw.fill(PASSWORD);
    await expect(list.locator('li.ok')).toHaveCount(3);
    await expect(page.locator('[data-error-for="password"]')).toHaveText('');
    await expect(submit).toBeDisabled(); // other fields still empty
  });

  test('confirm mismatch shows while typing; submit enables once everything is valid', async ({ page }) => {
    await fillSignUp(page, { email: uniqueEmail(), confirm: 'Abcdefg2' });
    await expect(page.locator('[data-error-for="confirmPassword"]')).toContainText(/do not match/i);
    await expect(page.getByRole('button', { name: 'Sign up' })).toBeDisabled();

    await page.getByLabel('Confirm password').fill(PASSWORD);
    await expect(page.locator('[data-error-for="confirmPassword"]')).toHaveText('');
    await expect(page.getByRole('button', { name: 'Sign up' })).toBeEnabled();
  });

  test('invalid email is flagged inline', async ({ page }) => {
    await page.goto('/sign-up');
    await page.getByLabel('Email').fill('nope');
    await expect(page.locator('[data-error-for="email"]')).toContainText(/valid email/i);
    await expect(page.getByLabel('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  test('taken email is detected live', async ({ page }) => {
    const email = uniqueEmail();
    await register(page, email);
    await page.goto('/sign-up');
    await page.getByLabel('Email').fill(email);
    await expect(page.locator('[data-error-for="email"]')).toContainText(/already registered/i);
  });

  test('server still validates when the browser checks are bypassed', async ({ page }) => {
    await page.goto('/sign-up');
    await page.getByLabel('First name').fill('Ada');
    await page.getByLabel('Last name').fill('Lovelace');
    await page.getByLabel('Email').fill(uniqueEmail());
    await page.getByLabel('Password', { exact: true }).fill('abcdefgh');
    await page.getByLabel('Confirm password').fill('abcdefgh');
    // Defeat the client: re-enable the button and drop the submit handler's guard.
    await page.evaluate(() => {
      const form = document.querySelector('form');
      form.querySelector('[data-submit]').disabled = false;
      form.addEventListener('submit', (e) => e.stopImmediatePropagation(), true);
    });
    await page.getByRole('button', { name: 'Sign up' }).click();
    await expect(page.locator('[data-error-for="password"]')).toContainText(/uppercase/i);
  });
});

test.describe('toasts', () => {
  test('close with the X button', async ({ page }) => {
    await login(page, 'nobody@example.com', 'Wrong123');
    const toast = page.locator('.toast-error');
    await expect(toast).toBeVisible();
    await toast.getByRole('button', { name: 'Dismiss notification' }).click();
    await expect(toast).toHaveCount(0);
  });

  test('disappear on their own after a few seconds', async ({ page }) => {
    await register(page, uniqueEmail());
    const toast = page.locator('.toast-success');
    await expect(toast).toBeVisible();
    await expect(toast).toHaveCount(0, { timeout: 10000 });
  });
});

test.describe('new-message counters', () => {
  test('shows live character counts and blocks empty submit', async ({ page }) => {
    const email = uniqueEmail();
    await register(page, email);
    await login(page, email);
    await page.goto('/messages/new');
    await expect(page.getByRole('button', { name: 'Post message' })).toBeDisabled();
    await page.getByLabel('Title').fill('Hello');
    await expect(page.locator('[data-counter-for="title"]')).toHaveText('5 / 100');
  });
});

test('full journey: guest → sign-up → post → member → admin → delete', async ({ page, browser }) => {
  const email = uniqueEmail();
  const title = `Journey ${Date.now()}`;

  // Sign up and log in. Not a member yet.
  await register(page, email);
  await login(page, email);
  await expect(page.getByRole('link', { name: 'New message' })).toBeVisible();

  // Post a message.
  await page.goto('/messages/new');
  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Message').fill('Anonymous words.');
  await page.getByRole('button', { name: 'Post message' }).click();
  await expect(page).toHaveURL(/\/$/);
  const card = page.locator('article.card', { hasText: title });
  await expect(card).toContainText('Anonymous words.');

  // Non-member: no author, no date, no delete.
  await expect(card).not.toContainText('Ada Lovelace');
  await expect(card.locator('time')).toHaveCount(0);
  await expect(card.getByRole('button', { name: 'Delete' })).toHaveCount(0);

  // A logged-out visitor sees the text without the author.
  const guest = await browser.newContext();
  const guestPage = await guest.newPage();
  await guestPage.goto('/');
  await expect(guestPage.locator('article.card', { hasText: title })).toContainText('Anonymous words.');
  await expect(guestPage.locator('article.card', { hasText: title })).not.toContainText('Ada Lovelace');
  await guest.close();

  // Wrong passcode, then the right one.
  await page.goto('/join-club');
  await page.getByLabel('Passcode').fill('wrong');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.locator('[data-error-for="passcode"]')).toContainText(/not the passcode/i);
  await page.getByLabel('Passcode').fill('member-pass');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page).toHaveURL(/\/$/);

  // Member: sees author and date, still no delete.
  await expect(card).toContainText('Ada Lovelace');
  await expect(card.locator('time')).toHaveCount(1);
  await expect(card.getByRole('button', { name: 'Delete' })).toHaveCount(0);

  // Become admin, delete the message.
  await page.goto('/become-admin');
  await page.getByLabel('Passcode').fill('admin-pass');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(card.getByRole('button', { name: 'Delete' })).toBeVisible();
  await card.getByRole('button', { name: 'Delete' }).click();
  await expect(page.locator('article.card', { hasText: title })).toHaveCount(0);
});
