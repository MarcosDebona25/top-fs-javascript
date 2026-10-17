import { expect, test } from '@playwright/test';
import { API_URL, AUTHOR_URL, READER_URL, clientHeaders, passwords, session } from './helpers.mjs';

test.use({ baseURL: AUTHOR_URL });

test.describe('the desk door', () => {
  test('sends anonymous visitors to the login page', async ({ page }) => {
    await page.goto('/essays/new');
    await expect(page).toHaveURL(`${AUTHOR_URL}/login`);
    await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();
  });

  test('turns reader accounts away and lets authors in', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill('reader1');
    await page.getByLabel('Password').fill(passwords.reader);
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByRole('alert')).toHaveText('This is a reader account. The desk is only for authors.');

    await page.getByLabel('Username').fill('author1');
    await page.getByLabel('Password').fill(passwords.author);
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByRole('heading', { name: 'Your essays' })).toBeVisible();
    await expect(page.locator('.desk-row')).toHaveCount(4);
  });
});

test.describe('signed-in author', () => {
  test.use({ storageState: session('author1') });

  test('filters the desk by status', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'All 4' })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Drafts 0' }).click();
    await expect(page.getByText('No drafts. Everything here is published.')).toBeVisible();
    await page.getByRole('button', { name: 'Published 4' }).click();
    await expect(page.locator('.desk-row')).toHaveCount(4);
  });

  test('writes a draft, previews it, publishes it, unpublishes it and deletes it', async ({ page, browser }) => {
    const title = `E2E essay ${Date.now()}`;
    await page.goto('/');
    await page.getByRole('main').getByRole('link', { name: 'New essay' }).click();
    await expect(page.getByRole('status').first()).toHaveText('New essay');

    await page.getByRole('button', { name: 'Save draft' }).click();
    await expect(page.getByRole('alert')).toHaveText('Give the essay a title.');

    await page.getByLabel('Title').fill(title);
    await page.getByLabel('Content · Markdown').fill('An opening line.\n\n## A section\n\nText with <b>html</b>.');
    await page.getByRole('button', { name: 'Save draft' }).click();
    await expect(page).toHaveURL(/\/essays\/\d+\/edit$/);
    await expect(page.getByText('Draft · Saved just now')).toBeVisible();
    const id = page.url().match(/essays\/(\d+)/)[1];

    // On the reader site a draft exists only for its author (same cookie); anyone else gets a 404.
    const reader = await page.context().newPage();
    await reader.goto(`${READER_URL}/posts/${id}`);
    await expect(reader.getByText('Draft · not published')).toBeVisible();
    // browser.newContext() inherits test.use() options, so the empty session must be explicit.
    const anonymous = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const stranger = await anonymous.newPage();
    await stranger.goto(`${READER_URL}/posts/${id}`);
    await expect(stranger.getByRole('heading', { name: 'This essay isn’t here.' })).toBeVisible();
    await anonymous.close();

    await page.getByRole('button', { name: 'Preview' }).click();
    await expect(page.getByText('This is how readers will see it. Not published yet.')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    await expect(page.locator('.prose')).toContainText('Text with <b>html</b>.');
    await page.getByRole('button', { name: 'Publish' }).click();
    await expect(page.getByText('Published. Readers can see it now.')).toBeVisible();
    await expect(page.getByText('Published · Saved just now')).toBeVisible();

    await reader.reload();
    await expect(reader.getByRole('heading', { level: 1 })).toHaveText(title);
    await reader.goto(READER_URL);
    await expect(reader.locator('#latest-title')).toHaveText(title);

    await page.getByRole('link', { name: '← Your essays' }).click();
    const row = page.locator('.desk-row').filter({ hasText: title });
    await row.getByRole('button', { name: 'Unpublish' }).click();
    await expect(row.getByText('Draft', { exact: true })).toBeVisible();
    await reader.reload();
    await expect(reader.locator('#latest-title')).not.toHaveText(title);

    await row.getByRole('button', { name: 'Delete' }).click();
    await expect(row.getByText('Delete this essay for good?')).toBeVisible();
    await row.getByRole('button', { name: 'Delete essay' }).click();
    await expect(page.locator('.desk-row').filter({ hasText: title })).toHaveCount(0);
  });

  test('keeps unsaved text on this device and restores it after a reload', async ({ page }) => {
    await page.goto('/essays/new');
    await page.getByLabel('Title').fill('Half-written thought');
    await page.getByLabel('Content · Markdown').fill('Not saved anywhere but here.');
    await expect(page.getByText('Not saved yet · kept on this device')).toBeVisible();

    await page.reload();
    await expect(page.getByText('Restored your unsaved changes from this device.')).toBeVisible();
    await expect(page.getByLabel('Title')).toHaveValue('Half-written thought');
    await page.getByRole('button', { name: 'Start over' }).click();
    await expect(page.getByLabel('Title')).toHaveValue('');
  });

  test('when the session ends mid-edit, logging in again saves the change', async ({ page }) => {
    await page.goto('/');
    const row = page.locator('.desk-row').filter({ has: page.locator('.status-published') }).first();
    const title = (await row.locator('h2').textContent()).trim();
    await row.getByRole('link', { name: 'Edit' }).click();
    await expect(page.getByLabel('Title')).toHaveValue(title);

    // End the session the way an expired cookie would: the API answers the next write with a 401.
    await page.context().clearCookies();
    await page.getByLabel('Title').fill(`${title}, revised`);
    await page.getByRole('button', { name: 'Save changes' }).click();

    const dialog = page.getByRole('dialog', { name: 'Log in to save your draft' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Logging in as author1');
    await dialog.getByLabel('Password').fill(passwords.author);
    await dialog.getByRole('button', { name: 'Log in and save' }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByText('Published · Saved just now')).toBeVisible();

    // Put the title back through the API so later runs see the seed data.
    const id = page.url().match(/essays\/(\d+)/)[1];
    const res = await page.request.patch(`${API_URL}/posts/${id}`, {
      headers: clientHeaders(AUTHOR_URL),
      data: { title },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('will not open another author’s essay', async ({ page, request }) => {
    const { posts } = await (await request.get(`${API_URL}/posts`)).json();
    const theirs = posts.find((post) => post.author.username !== 'author1');
    await page.goto(`/essays/${theirs.id}/edit`);
    await expect(page.getByRole('heading', { name: 'This essay isn’t on your desk.' })).toBeVisible();
  });
});
