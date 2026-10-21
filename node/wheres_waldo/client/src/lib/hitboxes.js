import { CHARACTER_SLUGS, MAP_SLUGS } from './maps.js';
import { roundRect } from './rect.js';

// The calibration tool reads and writes the same file the seed reads (api/prisma/data/hitboxes.json):
//   { "_warning"?: string, "maps": { "<map>": { "<character>": { x, y, width, height, calibrated } } } }
// x/y is the top-left corner; all four numbers are fractions of the image (0 to 1).

const hasRect = (box) => box && [box.x, box.y, box.width, box.height].every((value) => typeof value === 'number');

// The rectangles that were really drawn before (calibrated: true), as { [map]: { [character]: rect } }.
export function calibratedRects(file) {
  const rects = {};
  for (const map of MAP_SLUGS) {
    rects[map] = {};
    for (const character of CHARACTER_SLUGS) {
      const box = file?.maps?.[map]?.[character];
      if (hasRect(box) && box.calibrated === true) rects[map][character] = { x: box.x, y: box.y, width: box.width, height: box.height };
    }
  }
  return rects;
}

// What to save: drawn rectangles are marked calibrated; whatever is still missing keeps the file's placeholder so the
// seed stays valid. While any placeholder remains, the warning stays in the file.
export function buildHitboxes(file, drawn) {
  const maps = {};
  let placeholders = 0;
  for (const map of MAP_SLUGS) {
    maps[map] = {};
    for (const character of CHARACTER_SLUGS) {
      const rect = drawn?.[map]?.[character];
      if (rect) {
        maps[map][character] = { ...roundRect(rect), calibrated: true };
      } else {
        const previous = file?.maps?.[map]?.[character];
        maps[map][character] = hasRect(previous) ? { ...previous, calibrated: false } : { x: 0.02, y: 0.02, width: 0.04, height: 0.04, calibrated: false };
        placeholders += 1;
      }
    }
  }
  const output = {};
  if (placeholders > 0 && file?._warning) output._warning = file._warning;
  output.maps = maps;
  return { output, placeholders };
}

export const formatCoords = (rect) =>
  rect ? [rect.x, rect.y, rect.width, rect.height].map((value) => value.toFixed(3)).join(' · ') : null;
