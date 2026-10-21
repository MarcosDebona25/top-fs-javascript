import { expect, test } from '@playwright/test';
import { CHARACTERS, chooseCharacter, clickPicture, playThrough, startGame } from './helpers.js';

test.describe('a guest', () => {
  test('plays a scene start to finish and sees a time that is not saved', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Can you find all five/ })).toBeVisible();
    await page.getByRole('link', { name: /Play Beach/ }).click();

    // The modal announces the rule before the clock starts.
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/Every wrong guess adds \+1 second/)).toBeVisible();
    await expect(dialog.getByText(/Playing as a guest/)).toBeVisible();
    await expect(page.getByRole('timer')).toHaveText('0:00.000');
    await dialog.getByRole('button', { name: /Start/ }).click();
    await expect(dialog).toBeHidden();

    await playThrough(page, 'beach', { misses: 1 });

    await expect(page).toHaveURL(/\/result\/[0-9a-f-]{36}$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^\d+:\d{2}\.\d{3}$/);
    await expect(page.getByText(/for 1 wrong guess/)).toBeVisible();
    await expect(page.getByRole('heading', { name: "You played as a guest, so this time isn't saved." })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create account' })).toBeVisible();
  });

  test('is told when a guess is wrong and pays one second for it', async ({ page }) => {
    await startGame(page, 'Ski Slopes');
    await expect(page.getByText('No misses yet')).toBeVisible();
    await clickPicture(page, 'ski-slopes', { x: 0.5, y: 0.7 });
    await expect(page.getByRole('menu', { name: 'Who is here?' })).toBeVisible();
    await chooseCharacter(page, 'Woof');
    await expect(page.getByText('Not here: +1.0 s')).toBeVisible();
    await expect(page.getByText('+1.000 penalty · 1 miss')).toBeVisible();
    // The character is still hidden: Woof is still in the picker.
    await clickPicture(page, 'ski-slopes', { x: 0.5, y: 0.7 });
    await expect(page.getByRole('menuitem', { name: 'Woof' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toBeHidden();
  });

  test('removes a found character from the picker and crosses them off in the bar', async ({ page }) => {
    await startGame(page, 'Moon Base');
    await clickPicture(page, 'moon-base', { x: 0.125, y: 0.125 });
    await chooseCharacter(page, 'Waldo');
    await expect(page.getByText('Waldo found')).toBeAttached();
    await clickPicture(page, 'moon-base', { x: 0.5, y: 0.7 });
    await expect(page.getByRole('menuitem')).toHaveCount(CHARACTERS.length - 1);
    await expect(page.getByRole('menuitem', { name: 'Waldo' })).toHaveCount(0);
  });

  test('zooms in and out', async ({ page }) => {
    await startGame(page, 'Beach');
    const zoom = page.getByRole('group', { name: 'Zoom' }).first();
    await expect(zoom.getByText('100%')).toBeVisible();
    await zoom.getByRole('button', { name: 'Zoom in' }).click();
    await expect(zoom.getByText('125%')).toBeVisible();
    await page.locator('.viewport').focus();
    await page.keyboard.press('0');
    await expect(zoom.getByText('100%')).toBeVisible();
  });

  test('can quit back to the scenes', async ({ page }) => {
    await startGame(page, 'Beach');
    await page.getByRole('button', { name: 'Quit' }).click();
    await expect(page).toHaveURL('/');
  });

  test('browses the leaderboards without an account', async ({ page }) => {
    await page.goto('/ranking');
    await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Beach' })).toBeVisible();
    await page.getByRole('link', { name: 'Ski Slopes' }).click();
    await expect(page).toHaveURL(/\/ranking\/ski-slopes$/);
    await expect(page.getByRole('link', { name: 'Ski Slopes' })).toHaveAttribute('aria-current', 'page');
  });

  test('gets the 404 page for an address that does not exist', async ({ page }) => {
    await page.goto('/this-page-is-not-here');
    await expect(page.getByRole('heading', { name: "Even Waldo can't find this page." })).toBeVisible();
    await page.getByRole('link', { name: 'Back to the scenes' }).click();
    await expect(page.getByRole('heading', { name: 'Pick a scene' })).toBeVisible();
  });
});
