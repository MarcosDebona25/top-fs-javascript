// Rectangles are fractions of the image (0 to 1): x/y is the top-left corner.
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const clamp01 = (value) => clamp(value, 0, 1);

// The rectangle spanned by two points, in any order, kept inside the image.
export function rectFromPoints(a, b) {
  const x1 = clamp01(Math.min(a.x, b.x));
  const y1 = clamp01(Math.min(a.y, b.y));
  const x2 = clamp01(Math.max(a.x, b.x));
  const y2 = clamp01(Math.max(a.y, b.y));
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
}

export function roundRect(rect, digits = 4) {
  const factor = 10 ** digits;
  const round = (value) => Math.round(value * factor) / factor;
  return { x: round(rect.x), y: round(rect.y), width: round(rect.width), height: round(rect.height) };
}

// A drag that is barely a click is not a rectangle.
export function isUsableRect(rect, minSide = 0.002) {
  return rect.width >= minSide && rect.height >= minSide;
}

export function containsPoint(rect, point, margin = 0) {
  return (
    point.x >= rect.x - margin &&
    point.x <= rect.x + rect.width + margin &&
    point.y >= rect.y - margin &&
    point.y <= rect.y + rect.height + margin
  );
}
