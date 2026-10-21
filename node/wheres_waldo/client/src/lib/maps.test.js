import { describe, expect, it } from 'vitest';
import { camelCase, mapName, mapSrcSet, nextMapSlug, sceneLabel } from './maps.js';

describe('maps', () => {
  it('cycles through the scenes', () => {
    expect(nextMapSlug('beach')).toBe('ski-slopes');
    expect(nextMapSlug('ski-slopes')).toBe('moon-base');
    expect(nextMapSlug('moon-base')).toBe('beach');
  });

  it('names and numbers the scenes', () => {
    expect(mapName('moon-base')).toBe('Moon Base');
    expect(sceneLabel('ski-slopes')).toBe('Scene 2 · Ski Slopes');
  });

  it('builds a srcset from the generated widths', () => {
    expect(mapSrcSet('beach', 'avif', [640, 1024])).toBe('/img/maps/beach-640.avif 640w, /img/maps/beach-1024.avif 1024w');
  });

  it('turns slugs into the leaderboard column names', () => {
    expect(camelCase('ski-slopes')).toBe('skiSlopes');
    expect(camelCase('moon-base')).toBe('moonBase');
    expect(camelCase('beach')).toBe('beach');
  });
});
