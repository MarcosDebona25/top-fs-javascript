import { describe, expect, it } from 'vitest';
import { buildHitboxes, calibratedRects, formatCoords } from './hitboxes.js';
import { CHARACTER_SLUGS, MAP_SLUGS } from './maps.js';

const placeholder = { x: 0.02, y: 0.02, width: 0.04, height: 0.04, calibrated: false };
const file = {
  _warning: 'PLACEHOLDERS ONLY',
  maps: Object.fromEntries(MAP_SLUGS.map((map) => [map, Object.fromEntries(CHARACTER_SLUGS.map((character) => [character, { ...placeholder }]))])),
};

describe('buildHitboxes', () => {
  it('marks drawn rectangles as calibrated and keeps placeholders for the rest', () => {
    const { output, placeholders } = buildHitboxes(file, { beach: { waldo: { x: 0.61234, y: 0.484, width: 0.012, height: 0.03 } } });
    expect(output.maps.beach.waldo).toEqual({ x: 0.6123, y: 0.484, width: 0.012, height: 0.03, calibrated: true });
    expect(output.maps.beach.woof).toEqual(placeholder);
    expect(output.maps['moon-base'].odlaw).toEqual(placeholder);
    expect(placeholders).toBe(14);
    expect(output._warning).toBe('PLACEHOLDERS ONLY');
  });

  it('keeps the shape the seed reads: every map has every character', () => {
    const { output } = buildHitboxes(file, {});
    expect(Object.keys(output.maps)).toEqual(MAP_SLUGS);
    for (const map of MAP_SLUGS) expect(Object.keys(output.maps[map])).toEqual(CHARACTER_SLUGS);
  });

  it('drops the warning once nothing is a placeholder', () => {
    const drawn = Object.fromEntries(MAP_SLUGS.map((map) => [map, Object.fromEntries(CHARACTER_SLUGS.map((c) => [c, { x: 0.1, y: 0.1, width: 0.02, height: 0.02 }]))]));
    const { output, placeholders } = buildHitboxes(file, drawn);
    expect(placeholders).toBe(0);
    expect(output).not.toHaveProperty('_warning');
    expect(output.maps.beach.waldo.calibrated).toBe(true);
  });

  it('never invents positions: a missing entry becomes a flagged placeholder', () => {
    const { output } = buildHitboxes({ maps: {} }, {});
    expect(output.maps.beach.waldo.calibrated).toBe(false);
  });
});

describe('calibratedRects', () => {
  it('only reads back rectangles that were really calibrated', () => {
    const saved = structuredClone(file);
    saved.maps.beach.waldo = { x: 0.5, y: 0.5, width: 0.01, height: 0.02, calibrated: true };
    const rects = calibratedRects(saved);
    expect(rects.beach).toEqual({ waldo: { x: 0.5, y: 0.5, width: 0.01, height: 0.02 } });
    expect(rects['ski-slopes']).toEqual({});
  });
});

it('formatCoords prints four numbers or nothing', () => {
  expect(formatCoords({ x: 0.6, y: 0.45, width: 0.025, height: 0.05 })).toBe('0.600 · 0.450 · 0.025 · 0.050');
  expect(formatCoords(undefined)).toBeNull();
});
