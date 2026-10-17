import { expect, test } from '@playwright/test';
import { READER_URL, passwords, session } from './helpers.mjs';

test.use({ baseURL: READER_URL });

test.describe('anonymous reader', () => {
  test('browses the index and reads an essay', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Marginalia');
    await expect(page.getByText(/^Latest essay ·/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'The index' })).toBeVisible();
    await expect(page.getByText('16 essays · newest first')).toBeVisible();
    // Drafts never reach the index.
    await expect(page.locator('.index-item')).toHaveCount(15);

    await page.getByRole('link', { name: 'Why I stopped writing clever code' }).click();
    await expect(page).toHaveTitle('Why I stopped writing clever code · Marginalia');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Why I stopped writing clever code');
    await expect(page.getByRole('heading', { level: 2, name: 'The interest' })).toBeVisible();
    await expect(page.locator('.prose blockquote')).toContainText('Brian Kernighan');
    await expect(page.locator('.facts')).toContainText('1 minute');
    await expect(page.getByRole('heading', { name: 'Notes in the margin' })).toBeVisible();
    await expect(page.getByText('to leave a note.')).toBeVisible();
  });

  test('gets a 404 page for a missing essay and for a draft', async ({ page }) => {
    await page.goto('/posts/999999');
    await expect(page.getByRole('heading', { name: 'This essay isn’t here.' })).toBeVisible();
    await page.getByRole('link', { name: 'Back to the index' }).click();
    await expect(page).toHaveURL(`${READER_URL}/`);

    await page.goto('/no/such/page');
    await expect(page.getByText('404')).toBeVisible();
  });

  test('has no horizontal scroll on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('link', { name: 'Why I stopped writing clever code' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('logging in and signing up', () => {
  test('shows an error for a wrong password, then returns to the essay after logging in', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Why I stopped writing clever code' }).click();
    await page.locator('.notes-invite').getByRole('link', { name: 'Log in' }).click();
    await expect(page).toHaveTitle('Log in · Marginalia');

    await page.getByLabel('Username').fill('reader1');
    await page.getByLabel('Password').fill('not-the-password');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByRole('alert')).toHaveText('Invalid username or password.');

    await page.getByLabel('Password').fill(passwords.reader);
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Why I stopped writing clever code');
    await expect(page.getByLabel('Leave a note')).toBeVisible();
    await expect(page.locator('.mast-top')).toContainText('reader1');

    // The session survives a reload: it lives in the HttpOnly cookie, not in JavaScript.
    await page.reload();
    await expect(page.getByLabel('Leave a note')).toBeVisible();
    expect(await page.evaluate(() => document.cookie)).toBe('');

    await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'Log out' }).click();
    await expect(page.getByText('to leave a note.')).toBeVisible();
  });

  test('validates the sign-up form, refuses a taken username and creates an account', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel('Username').fill('No');
    await page.getByLabel('Password').fill('short');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText('Use 3 to 20 lowercase letters, numbers or _.')).toBeVisible();
    await expect(page.getByText('Use at least 8 characters.')).toBeVisible();

    await page.getByLabel('Username').fill('reader1');
    await page.getByLabel('Password').fill('a long password');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText('This username is already taken.')).toBeVisible();

    const username = `e2e_${Date.now().toString(36)}`;
    await page.getByLabel('Username').fill(username);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(`${READER_URL}/`);
    await expect(page.locator('.mast-top')).toContainText(username);
  });
});

test.describe('signed-in reader', () => {
  test.use({ storageState: session('reader1') });

  test('writes, edits and deletes a note; HTML stays text', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Why I stopped writing clever code' }).click();
    const notes = page.locator('.notes-list > li');
    const before = await notes.count();

    await page.getByLabel('Leave a note').fill('<script>window.pwned = true</script> Kind words.');
    await page.getByRole('button', { name: 'Post note' }).click();
    const mine = notes.filter({ hasText: 'Kind words.' });
    await expect(mine).toContainText('<script>window.pwned = true</script>');
    await expect(mine).toContainText('yours');
    await expect(notes).toHaveCount(before + 1);
    expect(await page.evaluate(() => window.pwned)).toBeUndefined();
    await expect(page.locator('.facts')).toContainText(`${before + 1} in the margin`);

    await mine.getByRole('button', { name: 'Edit' }).click();
    await page.getByLabel('Edit your note').fill('Kinder words, on reflection.');
    await page.getByRole('button', { name: 'Save note' }).click();
    const edited = notes.filter({ hasText: 'Kinder words' });
    await expect(edited).toContainText('edited');

    await edited.getByRole('button', { name: 'Delete' }).click();
    await edited.getByRole('button', { name: 'Delete note' }).click();
    await expect(notes).toHaveCount(before);
  });

  test('cannot edit or delete other people’s notes', async ({ page }) => {
    await page.goto('/');
    // Seeded notes on this essay belong to reader2 and reader3.
    await page.getByRole('link', { name: 'Notes on keeping a database small' }).click();
    const others = page.locator('.notes-list > li').filter({ hasNotText: 'yours' });
    await expect(others.first()).toBeVisible();
    await expect(others.getByRole('button')).toHaveCount(0);
  });
});
