import { clamp } from './rect.js';

export const MIN_SCALE = 1;
export const MAX_SCALE = 8;

// The picture is laid out fit-to-width: at scale 1 it is as wide as the stage. The stage shows a window onto it:
// `tx`/`ty` is where the picture's top-left corner sits inside the stage, in pixels, and `scale` magnifies it.
// A picture smaller than the stage is centred; a bigger one can't be dragged past its edges.
export function clampOffset({ tx, ty, scale }, stage, content) {
  const width = content.width * scale;
  const height = content.height * scale;
  return {
    tx: width <= stage.width ? (stage.width - width) / 2 : clamp(tx, stage.width - width, 0),
    ty: height <= stage.height ? (stage.height - height) / 2 : clamp(ty, stage.height - height, 0),
  };
}

export function clampScale(scale) {
  return clamp(scale, MIN_SCALE, MAX_SCALE);
}

// Zooms so the point under (px, py) — in stage pixels — stays where it is.
export function zoomAt(view, nextScale, px, py, stage, content) {
  const scale = clampScale(nextScale);
  const ratio = scale / view.scale;
  const moved = { scale, tx: px - (px - view.tx) * ratio, ty: py - (py - view.ty) * ratio };
  return { scale, ...clampOffset(moved, stage, content) };
}

// A point in stage pixels to image fractions (can fall outside 0..1 when the stage shows empty space).
export function stageToImage(view, content, px, py) {
  return { x: (px - view.tx) / (content.width * view.scale), y: (py - view.ty) / (content.height * view.scale) };
}

// Image fractions to stage pixels.
export function imageToStage(view, content, x, y) {
  return { x: view.tx + x * content.width * view.scale, y: view.ty + y * content.height * view.scale };
}

export const isInsideImage = (point) => point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1;

// A wheel notch: roughly 12% per standard step, smooth for trackpads.
export const wheelScale = (scale, deltaY) => scale * Math.exp(-deltaY * 0.0015);
