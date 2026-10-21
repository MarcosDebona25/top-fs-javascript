import { describe, expect, it } from 'vitest';
import { MAX_SCALE, MIN_SCALE, clampOffset, clampScale, imageToStage, isInsideImage, stageToImage, wheelScale, zoomAt } from './viewport.js';

const stage = { width: 1000, height: 600 };
const content = { width: 1000, height: 640 }; // fit to width: a little taller than the stage

describe('clampOffset', () => {
  it('centres a picture smaller than the stage', () => {
    const small = { width: 1000, height: 400 };
    expect(clampOffset({ tx: 0, ty: 0, scale: 1 }, stage, small)).toEqual({ tx: 0, ty: 100 });
  });

  it('keeps a bigger picture covering the stage', () => {
    expect(clampOffset({ tx: 50, ty: 50, scale: 1 }, stage, content)).toEqual({ tx: 0, ty: 0 });
    expect(clampOffset({ tx: -9999, ty: -9999, scale: 2 }, stage, content)).toEqual({ tx: -1000, ty: -680 });
  });
});

describe('zoomAt', () => {
  it('keeps the point under the pointer where it is', () => {
    const start = { scale: 1, tx: 0, ty: 0 };
    const before = stageToImage(start, content, 400, 300);
    const zoomed = zoomAt(start, 3, 400, 300, stage, content);
    const after = stageToImage(zoomed, content, 400, 300);
    expect(zoomed.scale).toBe(3);
    expect(after.x).toBeCloseTo(before.x);
    expect(after.y).toBeCloseTo(before.y);
  });

  it('never zooms out past fit-to-width or in past the maximum', () => {
    const start = { scale: 1, tx: 0, ty: 0 };
    expect(zoomAt(start, 0.2, 0, 0, stage, content).scale).toBe(MIN_SCALE);
    expect(zoomAt(start, 100, 0, 0, stage, content).scale).toBe(MAX_SCALE);
    expect(clampScale(3)).toBe(3);
  });
});

describe('coordinates', () => {
  it('maps stage pixels to image fractions and back', () => {
    const view = { scale: 2, tx: -300, ty: -120 };
    const point = stageToImage(view, content, 500, 300);
    expect(point.x).toBeCloseTo(0.4);
    expect(point.y).toBeCloseTo((300 + 120) / (640 * 2));
    const back = imageToStage(view, content, point.x, point.y);
    expect(back.x).toBeCloseTo(500);
    expect(back.y).toBeCloseTo(300);
  });

  it('knows when a point is outside the picture', () => {
    expect(isInsideImage({ x: 0.5, y: 0.5 })).toBe(true);
    expect(isInsideImage({ x: 1.01, y: 0.5 })).toBe(false);
    expect(isInsideImage({ x: 0.5, y: -0.1 })).toBe(false);
  });

  it('zooms in when the wheel goes up and out when it goes down', () => {
    expect(wheelScale(1, -100)).toBeGreaterThan(1);
    expect(wheelScale(2, 100)).toBeLessThan(2);
  });
});
