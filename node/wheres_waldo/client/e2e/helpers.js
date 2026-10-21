import { expect } from '@playwright/test';

// Known rectangles (image fractions) the global setup writes for every scene.
export const CHARACTER_HITBOXES = {
  waldo: { x: 0.1, y: 0.1, width: 0.05, height: 0.05 },
  woof: { x: 0.3, y: 0.1, width: 0.05, height: 0.05 },
  wenda: { x: 0.5, y: 0.1, width: 0.05, height: 0.05 },
  wizard: { x: 0.7, y: 0.1, width: 0.05, height: 0.05 },
  odlaw: { x: 0.9, y: 0.1, width: 0.05, height: 0.05 },
};

export const CHARACTERS = [
  ['waldo', 'Waldo'],
  ['woof', 'Woof'],
  ['wenda', 'Wenda'],
  ['wizard', 'Wizard Whitebeard'],
  ['odlaw', 'Odlaw'],
];

const ASPECT = { beach: 1644 / 2560, 'ski-slopes': 1623 / 2560, 'moon-base': 1685 / 2560 };

const centerOf = (slug) => {
  const box = CHARACTER_HITBOXES[slug];
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

// Where a point of the picture is on the screen, at zoom 100%: the picture is as wide as the stage, centred
// vertically when shorter than it and pinned to the top when taller.
export async function screenPoint(page, map, fraction) {
  const box = await page.locator('.viewport').boundingBox();
  const height = box.width * ASPECT[map];
  const top = height <= box.height ? (box.height - height) / 2 : 0;
  return { x: box.x + fraction.x * box.width, y: box.y + top + fraction.y * height };
}

// Click on the picture; with `mobile` it is a tap.
export async function clickPicture(page, map, fraction, { mobile = false } = {}) {
  const point = await screenPoint(page, map, fraction);
  if (mobile) await page.touchscreen.tap(point.x, point.y);
  else await page.mouse.click(point.x, point.y);
}

export async function chooseCharacter(page, name, { mobile = false } = {}) {
  await page.getByRole(mobile ? 'button' : 'menuitem', { name }).click();
}

// Opens a scene from the landing page and starts the clock.
export async function startGame(page, sceneName) {
  await page.goto('/');
  await page.getByRole('link', { name: new RegExp(`Play ${sceneName}`) }).click();
  await page.getByRole('button', { name: /Start/ }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
}

// Finds every character at its known rectangle, optionally after some wrong clicks on empty water.
export async function playThrough(page, map, { misses = 0, mobile = false } = {}) {
  for (let i = 0; i < misses; i += 1) {
    await clickPicture(page, map, { x: 0.5, y: 0.7 }, { mobile });
    await chooseCharacter(page, 'Waldo', { mobile });
    await expect(page.getByText(/Not here/)).toBeVisible();
  }
  for (const [slug, name] of CHARACTERS) {
    await clickPicture(page, map, centerOf(slug), { mobile });
    await chooseCharacter(page, name, { mobile });
    if (slug !== 'odlaw') await expect(page.getByText(`${name} found`)).toBeVisible();
  }
}

export const uniqueName = (prefix = 'e2e') => `${prefix}_${Date.now().toString(36)}${Math.floor(Math.random() * 36 ** 3).toString(36)}`.slice(0, 20);

export async function signUp(page, username, password = 'correct-horse-battery') {
  await page.goto('/signup');
  await page.getByLabel('Username').fill(username);
  await expect(page.getByText(`${username} is available`)).toBeVisible();
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.locator('.nav__user')).toHaveText(username);
}
