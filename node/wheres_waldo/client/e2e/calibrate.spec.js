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

  test('draws a rectangle and writes it into the JSON as calibrated', async ({ page }) => {
    await page.goto('/dev/calibrate');
    await expect(page.getByText('DEV ONLY')).toBeVisible();
    const stage = page.locator('.calibrate__viewport');
    const box = await stage.boundingBox();
    await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.45);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.625, box.y + box.height * 0.5, { steps: 5 });
    await page.mouse.up();

    await expect(page.getByRole('button', { name: /Waldo/ })).toContainText('Saved');
    // The next character that still needs a rectangle is selected.
    await expect(page.getByRole('button', { name: /Woof/ })).toHaveAttribute('aria-pressed', 'true');
    const json = JSON.parse(await page.locator('.calibrate__json').innerText());
    expect(json.maps.beach.waldo.calibrated).toBe(true);
    expect(json.maps.beach.waldo.x).toBeCloseTo(0.6, 1);
    expect(json.maps.beach.woof.calibrated).toBe(false);
    expect(Object.keys(json.maps)).toEqual(['beach', 'ski-slopes', 'moon-base']);
  });

  test('keeps the drawing after a reload', async ({ page }) => {
    await page.goto('/dev/calibrate');
    const box = await page.locator('.calibrate__viewport').boundingBox();
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.35, box.y + box.height * 0.36, { steps: 4 });
    await page.mouse.up();
    await page.reload();
    await expect(page.getByRole('button', { name: /Waldo/ })).toContainText('Saved');
  });
});
