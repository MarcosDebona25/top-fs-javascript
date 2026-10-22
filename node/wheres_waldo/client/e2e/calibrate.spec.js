import { expect, test } from '@playwright/test';

test.describe("calibration tool (development only)", () => {
  test.beforeEach(async ({ page }) => {
    // Start every test from the file's rectangles, but let a reload inside a test keep its drawing.
    await page.addInitScript(() => {
      if (window.sessionStorage.getItem('cleared')) return;
      window.localStorage.removeItem('waldo.calibration.v1');
      window.sessionStorage.setItem('cleared', '1');
    });
  });

  test('redraws a rectangle and writes it into the JSON as calibrated', async ({ page }) => {
    await page.goto('/dev/calibrate');
    await expect(page.getByText('DEV ONLY')).toBeVisible();
    await page.getByRole('button', { name: 'Clear selected' }).click();
    await expect(page.getByRole('button', { name: /Waldo/ })).toContainText('not drawn');
    await page.getByRole('button', { name: 'Draw box' }).click();
    const stage = page.locator('.calibrate__viewport');
    const box = await stage.boundingBox();
    await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.45);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.625, box.y + box.height * 0.5, { steps: 5 });
    await page.mouse.up();

    await expect(page.getByRole('button', { name: /Waldo/ })).toContainText('Saved');
    // Every other character already has a rectangle, so the selection stays put.
    await expect(page.getByRole('button', { name: /Waldo/ })).toHaveAttribute('aria-pressed', 'true');
    await page.getByText('Export JSON').click();
    const json = JSON.parse(await page.locator('.calibrate__json').innerText());
    expect(json.maps.beach.waldo.calibrated).toBe(true);
    expect(json.maps.beach.waldo.x).toBeCloseTo(0.6, 1);
    expect(json.maps.beach.woof.calibrated).toBe(true);
    expect(json).not.toHaveProperty('_warning');
    expect(Object.keys(json.maps)).toEqual(['beach', 'ski-slopes', 'moon-base']);
  });

  test('pans in Move mode without drawing a rectangle', async ({ page }) => {
    await page.goto('/dev/calibrate');
    await expect(page.getByRole('button', { name: 'Move' })).toHaveAttribute('aria-pressed', 'true');
    const stage = page.locator('.calibrate__viewport');
    const box = await stage.boundingBox();
    const content = page.locator('.viewport__content');
    const before = await content.evaluate((element) => element.style.transform);
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.65);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.35, { steps: 8 });
    await page.mouse.up();

    const after = await content.evaluate((element) => element.style.transform);
    expect(after).not.toBe(before);
    await expect(page.locator('.hitbox')).toHaveCount(5);
    await expect(page.getByRole('button', { name: /Waldo/ })).toContainText('0.605 · 0.358');
  });

  test('keeps the drawing after a reload', async ({ page }) => {
    await page.goto('/dev/calibrate');
    await page.getByRole('button', { name: 'Clear selected' }).click();
    await page.getByRole('button', { name: 'Draw box' }).click();
    const box = await page.locator('.calibrate__viewport').boundingBox();
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.35, box.y + box.height * 0.36, { steps: 4 });
    await page.mouse.up();
    await page.reload();
    await expect(page.getByRole('button', { name: /Waldo/ })).toContainText('Saved');
    await expect(page.getByRole('button', { name: /Waldo/ })).not.toContainText('0.605 · 0.358');
  });
});
