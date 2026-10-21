import { describe, expect, it } from 'vitest';
import { clamp, containsPoint, isUsableRect, rectFromPoints, roundRect } from './rect.js';

describe('rectFromPoints', () => {
  it('orders the corners whichever way the drag went', () => {
    const expected = { x: 0.2, y: 0.3, width: 0.3, height: 0.4 };
    const rect = rectFromPoints({ x: 0.5, y: 0.7 }, { x: 0.2, y: 0.3 });
    expect(rect.x).toBeCloseTo(expected.x);
    expect(rect.y).toBeCloseTo(expected.y);
    expect(rect.width).toBeCloseTo(expected.width);
    expect(rect.height).toBeCloseTo(expected.height);
  });

  it('keeps the rectangle inside the image', () => {
    const rect = rectFromPoints({ x: -0.2, y: 0.5 }, { x: 1.4, y: 2 });
    expect(rect).toEqual({ x: 0, y: 0.5, width: 1, height: 0.5 });
  });
});

describe('roundRect and isUsableRect', () => {
  it('rounds to four decimals', () => {
    expect(roundRect({ x: 0.123456, y: 0.5, width: 0.0333333, height: 0.04 })).toEqual({ x: 0.1235, y: 0.5, width: 0.0333, height: 0.04 });
  });

  it('rejects a drag that is barely a click', () => {
    expect(isUsableRect({ x: 0.1, y: 0.1, width: 0.0005, height: 0.03 })).toBe(false);
    expect(isUsableRect({ x: 0.1, y: 0.1, width: 0.02, height: 0.03 })).toBe(true);
  });
});

describe('containsPoint', () => {
  const rect = { x: 0.1, y: 0.1, width: 0.05, height: 0.05 };

  it('includes the edges', () => {
    expect(containsPoint(rect, { x: 0.1, y: 0.15 })).toBe(true);
    expect(containsPoint(rect, { x: 0.2, y: 0.12 })).toBe(false);
  });

  it('grows by the margin on every side', () => {
    expect(containsPoint(rect, { x: 0.095, y: 0.1 }, 0.005)).toBe(true);
    expect(containsPoint(rect, { x: 0.094, y: 0.1 }, 0.005)).toBe(false);
  });
});

it('clamp keeps a value within bounds', () => {
  expect(clamp(5, 0, 3)).toBe(3);
  expect(clamp(-1, 0, 3)).toBe(0);
  expect(clamp(2, 0, 3)).toBe(2);
});
