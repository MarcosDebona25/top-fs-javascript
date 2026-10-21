import { expect, test } from '@playwright/test';
import { playThrough, signUp, startGame, uniqueName } from './helpers.js';

test.describe('a registered player', () => {
  test('signs up with inline checks, plays and lands on the leaderboard', async ({ page }) => {
    const username = uniqueName();
    await page.goto('/signup');

    // Inline validation: format, then availability, then the password pair.
    await page.getByLabel('Username').fill('po');
    await expect(page.getByText('Use at least 3 characters')).toBeVisible();
    await page.getByLabel('Username').fill(username);
    await expect(page.getByText(`${username} is available`)).toBeVisible();
    await page.getByLabel('Password', { exact: true }).fill('correct-horse-battery');
    await page.getByLabel('Confirm password').fill('correct-horse-batterX');
    await expect(page.getByText("Passwords don't match")).toBeVisible();
    await page.getByLabel('Confirm password').fill('correct-horse-battery');
    await expect(page.getByText("Passwords don't match")).toBeHidden();
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.locator('.nav__user')).toHaveText(username);

    await startGame(page, 'Beach');
    await playThrough(page, 'beach');

    await expect(page).toHaveURL(/\/result\//);
    await expect(page.getByText('New personal best')).toBeVisible();
    await expect(page.getByText('Beach rank', { exact: true })).toBeVisible();
    await expect(page.getByText('Global rank', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Next: Ski Slopes' })).toBeVisible();
    await expect(page.locator('.is-you')).toContainText(username);

    await page.goto('/');
    const row = page.locator('tr.is-you');
    await expect(row).toContainText(username);
    await expect(row).toContainText('—'); // the other two scenes are not done yet
  });

  test('tells the modal the time will be saved', async ({ page }) => {
    const username = uniqueName();
    await signUp(page, username);
    await page.goto('/play/ski-slopes');
    await expect(page.getByText(/Your best time goes on the leaderboard/)).toBeVisible();
  });

  test('rejects a username that is already taken, in any case', async ({ page, browser }) => {
    const username = uniqueName();
    await signUp(page, username);
    const other = await browser.newPage();
    await other.goto('http://[::1]:5174/signup');
    await other.getByLabel('Username').fill(username.toUpperCase());
    await expect(other.getByText('That username is already taken')).toBeVisible();
    await other.close();
  });

  test('logs out and back in, and sees an error for a wrong password', async ({ page }) => {
    const username = uniqueName();
    await signUp(page, username, 'correct-horse-battery');
    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();

    await page.getByRole('link', { name: 'Log in' }).click();
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill('not-the-password');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByRole('alert')).toHaveText('Wrong username or password.');

    await page.getByLabel('Password').fill('correct-horse-battery');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page.locator('.nav__user')).toHaveText(username);
  });

  test('stays logged in after a reload', async ({ page }) => {
    const username = uniqueName();
    await signUp(page, username);
    await page.reload();
    await expect(page.locator('.nav__user')).toHaveText(username);
  });

  test('sees a ranking update live when another player finishes', async ({ page, browser }) => {
    await page.goto('/ranking/beach');
    await expect(page.getByText('Updating live')).toBeVisible();

    const rival = await browser.newPage();
    const name = uniqueName('rival');
    await signUp(rival, name);
    await startGame(rival, 'Beach');
    await playThrough(rival, 'beach');
    await expect(rival).toHaveURL(/\/result\//);

    await expect(page.getByRole('cell', { name })).toBeVisible({ timeout: 10_000 });
    await rival.close();
  });
});
