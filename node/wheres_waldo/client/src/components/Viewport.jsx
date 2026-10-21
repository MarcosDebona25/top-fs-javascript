import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { clampOffset, clampScale, imageToStage, stageToImage, wheelScale, zoomAt } from '../lib/viewport.js';

const TAP_SLOP = 8; // pixels a pointer may move and still count as a tap
const KEY_PAN = 80;

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

// A stage showing a picture fit to its width, which can be zoomed (wheel, buttons, pinch, keys) and dragged.
// `image` is the picture, `overlay({ view, content, toStage })` draws things in screen pixels on top of it
// (so rings and labels keep their size while zooming). `onPick(point)` fires on a tap, with image fractions.
export const Viewport = forwardRef(function Viewport(
  { aspect, image, overlay, onPick, shouldPan, onViewChange, label, className = '', ...pointerHandlers },
  ref,
) {
  const stageRef = useRef(null);
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const [view, setViewState] = useState({ scale: 1, tx: 0, ty: 0 });
  const viewRef = useRef(view);
  const stageSizeRef = useRef(stage);
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const [dragging, setDragging] = useState(false);

  const content = { width: stage.width || 1, height: (stage.width || 1) * aspect };
  const contentRef = useRef(content);
  contentRef.current = content;

  const commit = useCallback((next) => {
    viewRef.current = next;
    setViewState(next);
  }, []);

  useLayoutEffect(() => {
    const element = stageRef.current;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      const size = { width: rect.width, height: rect.height };
      stageSizeRef.current = size;
      setStage(size);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // A resized stage keeps the zoom but must keep the picture inside it.
  useEffect(() => {
    const current = viewRef.current;
    const size = { width: stage.width || 1, height: (stage.width || 1) * aspect };
    commit({ scale: current.scale, ...clampOffset(current, stage, size) });
  }, [stage, aspect, commit]);

  useEffect(() => {
    onViewChange?.(view);
  }, [view, onViewChange]);

  const apply = useCallback(
    (next) => commit({ scale: next.scale, ...clampOffset(next, stageSizeRef.current, contentRef.current) }),
    [commit],
  );

  const zoomTo = useCallback(
    (scale, px, py) => commit(zoomAt(viewRef.current, scale, px, py, stageSizeRef.current, contentRef.current)),
    [commit],
  );

  const zoomBy = useCallback(
    (factor) => {
      const size = stageSizeRef.current;
      zoomTo(viewRef.current.scale * factor, size.width / 2, size.height / 2);
    },
    [zoomTo],
  );

  const toImage = useCallback((clientX, clientY) => {
    const rect = stageRef.current.getBoundingClientRect();
    return stageToImage(viewRef.current, contentRef.current, clientX - rect.left, clientY - rect.top);
  }, []);

  const toStage = useCallback((x, y) => imageToStage(viewRef.current, contentRef.current, x, y), []);

  useImperativeHandle(
    ref,
    () => ({
      zoomBy,
      reset: () => zoomTo(1, 0, 0),
      panBy: (dx, dy) => apply({ ...viewRef.current, tx: viewRef.current.tx + dx, ty: viewRef.current.ty + dy }),
      toImage,
      toStage,
      getView: () => viewRef.current,
    }),
    [zoomBy, zoomTo, apply, toImage, toStage],
  );

  // The wheel needs a non-passive listener to stop the page from scrolling.
  useEffect(() => {
    const element = stageRef.current;
    const onWheel = (event) => {
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      zoomTo(wheelScale(viewRef.current.scale, delta), event.clientX - rect.left, event.clientY - rect.top);
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [zoomTo]);

  const local = (event) => {
    const rect = stageRef.current.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  function onPointerDown(event) {
    pointerHandlers.onPointerDown?.(event);
    if (event.target.closest?.('[data-no-pan]')) return;
    if (shouldPan && !shouldPan(event)) return;
    if (event.pointerType === 'mouse' && event.button !== 0 && event.button !== 1) return;
    stageRef.current.setPointerCapture?.(event.pointerId);
    pointers.current.set(event.pointerId, local(event));
    const points = [...pointers.current.values()];
    if (points.length === 1) {
      gesture.current = { kind: 'drag', start: points[0], startView: viewRef.current, moved: false };
    } else if (points.length === 2) {
      gesture.current = {
        kind: 'pinch',
        startDistance: Math.max(1, distance(points[0], points[1])),
        startMid: midpoint(points[0], points[1]),
        startView: viewRef.current,
        moved: true,
      };
    }
  }

  function onPointerMove(event) {
    pointerHandlers.onPointerMove?.(event);
    if (!pointers.current.has(event.pointerId) || !gesture.current) return;
    const here = local(event);
    pointers.current.set(event.pointerId, here);
    const current = gesture.current;
    if (current.kind === 'drag') {
      const dx = here.x - current.start.x;
      const dy = here.y - current.start.y;
      if (!current.moved && Math.hypot(dx, dy) < TAP_SLOP) return;
      current.moved = true;
      setDragging(true);
      apply({ scale: current.startView.scale, tx: current.startView.tx + dx, ty: current.startView.ty + dy });
    } else if (current.kind === 'pinch') {
      const points = [...pointers.current.values()];
      if (points.length < 2) return;
      const mid = midpoint(points[0], points[1]);
      const scale = clampScale(current.startView.scale * (distance(points[0], points[1]) / current.startDistance));
      const zoomed = zoomAt(current.startView, scale, current.startMid.x, current.startMid.y, stageSizeRef.current, contentRef.current);
      apply({ scale: zoomed.scale, tx: zoomed.tx + (mid.x - current.startMid.x), ty: zoomed.ty + (mid.y - current.startMid.y) });
    }
  }

  function endPointer(event, cancelled) {
    pointerHandlers.onPointerUp?.(event);
    if (!pointers.current.has(event.pointerId)) return;
    const wasTap = gesture.current?.kind === 'drag' && !gesture.current.moved && !cancelled && event.button <= 0;
    pointers.current.delete(event.pointerId);
    stageRef.current.releasePointerCapture?.(event.pointerId);
    if (pointers.current.size === 0) {
      gesture.current = null;
      setDragging(false);
    } else if (pointers.current.size === 1) {
      // One finger left after a pinch: carry on dragging from where it is, and never count it as a tap.
      const [remaining] = pointers.current.values();
      gesture.current = { kind: 'drag', start: remaining, startView: viewRef.current, moved: true };
    }
    if (wasTap && onPick) {
      const point = toImage(event.clientX, event.clientY);
      if (point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1) onPick(point, local(event), stageSizeRef.current);
    }
  }

  function onKeyDown(event) {
    if (event.target !== stageRef.current) return;
    const size = stageSizeRef.current;
    const pan = (dx, dy) => apply({ ...viewRef.current, tx: viewRef.current.tx + dx, ty: viewRef.current.ty + dy });
    switch (event.key) {
      case '+':
      case '=':
        zoomBy(1.25);
        break;
      case '-':
      case '_':
        zoomBy(0.8);
        break;
      case '0':
        zoomTo(1, 0, 0);
        break;
      case 'ArrowLeft':
        pan(KEY_PAN, 0);
        break;
      case 'ArrowRight':
        pan(-KEY_PAN, 0);
        break;
      case 'ArrowUp':
        pan(0, KEY_PAN);
        break;
      case 'ArrowDown':
        pan(0, -KEY_PAN);
        break;
      case 'Enter':
      case ' ':
        if (!onPick) return;
        onPick(stageToImage(viewRef.current, contentRef.current, size.width / 2, size.height / 2), { x: size.width / 2, y: size.height / 2 }, size);
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  return (
    <div
      ref={stageRef}
      className={`viewport${dragging ? ' is-dragging' : ''} ${className}`}
      tabIndex={0}
      role="group"
      aria-label={label}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => endPointer(event, false)}
      onPointerCancel={(event) => endPointer(event, true)}
      onKeyDown={onKeyDown}
    >
      <div
        className="viewport__content"
        style={{
          width: content.width,
          height: content.height,
          transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})`,
        }}
      >
        {typeof image === 'function' ? image({ view, content }) : image}
      </div>
      <div className="viewport__overlay">{overlay?.({ view, content, stage, toStage: (x, y) => imageToStage(view, content, x, y) })}</div>
    </div>
  );
});
