import { devices, expect, test } from '@playwright/test';
import { chooseCharacter, clickPicture, playThrough, startGame } from './helpers.js';

test.use({ ...devices['Pixel 5'] });

test.describe('on a phone', () => {
  test('picks a character from the bottom sheet and finishes the scene', async ({ page }) => {
    await startGame(page, 'Beach');

    await clickPicture(page, 'beach', { x: 0.5, y: 0.5 }, { mobile: true });
    const sheet = page.getByRole('dialog', { name: 'Who is here?' });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await sheet.getByRole('button', { name: 'Cancel' }).click();
    await expect(sheet).toBeHidden();

    await playThrough(page, 'beach', { mobile: true });
    await expect(page).toHaveURL(/\/result\//);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^\d+:\d{2}\.\d{3}$/);
  });

  test('has no horizontal scroll on the landing page and the rankings', async ({ page }) => {
    for (const path of ['/', '/ranking', '/login', '/signup']) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} scrolls sideways`).toBeLessThanOrEqual(0);
    }
  });

  test('keeps the other choices in the sheet once one is found', async ({ page }) => {
    await startGame(page, 'Moon Base');
    await clickPicture(page, 'moon-base', { x: 0.125, y: 0.125 }, { mobile: true });
    await chooseCharacter(page, 'Waldo', { mobile: true });
    await clickPicture(page, 'moon-base', { x: 0.5, y: 0.5 }, { mobile: true });
    const sheet = page.getByRole('dialog', { name: 'Who is here?' });
    await expect(sheet.getByRole('button', { name: 'Waldo' })).toHaveCount(0);
    await expect(sheet.getByRole('button', { name: 'Woof' })).toBeVisible();
  });
});
