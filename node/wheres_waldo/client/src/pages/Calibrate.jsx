import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import existingFile from '../../../api/prisma/data/hitboxes.json';
import { MapPicture } from '../components/MapPicture.jsx';
import { Viewport } from '../components/Viewport.jsx';
import { buildHitboxes, calibratedRects, formatCoords } from '../lib/hitboxes.js';
import { CHARACTER_COLORS, CHARACTER_SLUGS, MAP_SLUGS, characterImage, mapName } from '../lib/maps.js';
import { isUsableRect, rectFromPoints } from '../lib/rect.js';

const STORAGE_KEY = 'waldo.calibration.v1';
const CHARACTER_NAMES = { waldo: 'Waldo', woof: 'Woof', wenda: 'Wenda', wizard: 'Wizard Whitebeard', odlaw: 'Odlaw' };

// Drafts survive a reload; the file on disk is only changed by the person, after downloading the result.
function loadDraft() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved === 'object') return saved;
  } catch {
    /* storage unavailable or corrupt: start from the file */
  }
  return calibratedRects(existingFile);
}

function saveDraft(rects) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rects));
  } catch {
    /* ignore */
  }
}

export default function Calibrate() {
  const [map, setMap] = useState(MAP_SLUGS[0]);
  const [character, setCharacter] = useState(CHARACTER_SLUGS[0]);
  const [rects, setRects] = useState(loadDraft);
  const [draft, setDraft] = useState(null);
  const [pointer, setPointer] = useState(null);
  const [sizes, setSizes] = useState(null);
  const [copied, setCopied] = useState(false);
  const viewport = useRef(null);
  const drawing = useRef(null);
  const spaceDown = useRef(false);

  useEffect(() => {
    document.title = "Hitbox calibration · Where's Waldo?";
    fetch('/img/maps/manifest.json')
      .then((response) => response.json())
      .then(setSizes)
      .catch(() => setSizes(null));
  }, []);

  useEffect(() => saveDraft(rects), [rects]);

  useEffect(() => {
    const down = (event) => {
      if (event.code === 'Space' && !/INPUT|TEXTAREA|BUTTON/.test(document.activeElement?.tagName ?? '')) {
        spaceDown.current = true;
        event.preventDefault();
      }
      if (event.key === 'Escape') {
        drawing.current = null;
        setDraft(null);
      }
    };
    const up = (event) => {
      if (event.code === 'Space') spaceDown.current = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const mapRects = rects[map] ?? {};
  const size = sizes?.[map];
  const aspect = size ? size.height / size.width : 0.64;

  const setRect = useCallback((targetMap, targetCharacter, rect) => {
    setRects((current) => {
      const next = { ...current, [targetMap]: { ...(current[targetMap] ?? {}) } };
      if (rect) next[targetMap][targetCharacter] = rect;
      else delete next[targetMap][targetCharacter];
      return next;
    });
  }, []);

  const shouldPan = (event) => spaceDown.current || event.button === 1;

  function onPointerDown(event) {
    if (spaceDown.current || event.button !== 0 || event.target.closest('[data-no-pan]')) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const start = viewport.current.toImage(event.clientX, event.clientY);
    drawing.current = { start, pointerId: event.pointerId };
    setDraft(rectFromPoints(start, start));
  }

  function onPointerMove(event) {
    const point = viewport.current.toImage(event.clientX, event.clientY);
    setPointer(point);
    if (drawing.current?.pointerId === event.pointerId) setDraft(rectFromPoints(drawing.current.start, point));
  }

  function onPointerUp(event) {
    if (drawing.current?.pointerId !== event.pointerId) return;
    const rect = rectFromPoints(drawing.current.start, viewport.current.toImage(event.clientX, event.clientY));
    drawing.current = null;
    setDraft(null);
    if (!isUsableRect(rect)) return;
    setRect(map, character, rect);
    // On to the next character that still needs a rectangle.
    const next = CHARACTER_SLUGS.find((slug) => slug !== character && !(rects[map] ?? {})[slug]);
    if (next) setCharacter(next);
  }

  const { output, placeholders } = useMemo(() => buildHitboxes(existingFile, rects), [rects]);
  const json = useMemo(() => `${JSON.stringify(output, null, 2)}\n`, [output]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hitboxes.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  const status = (slug) => {
    if (draft && slug === character) return { text: 'Drawing…', tone: 'is-selected' };
    if (mapRects[slug]) return { text: 'Saved', tone: 'is-done' };
    return slug === character ? { text: 'Selected', tone: 'is-selected' } : { text: 'Pending', tone: '' };
  };

  return (
    <div className="calibrate">
      <header className="container calibrate__head">
        <div className="calibrate__title">
          <h1 className="display">Hitbox calibration</h1>
          <span className="dev-badge">DEV ONLY</span>
        </div>
        <nav className="tabs calibrate__tabs" aria-label="Scene">
          {MAP_SLUGS.map((slug) => (
            <button
              key={slug}
              type="button"
              className="tabs__link calibrate__tab"
              aria-current={slug === map ? 'page' : undefined}
              onClick={() => {
                setMap(slug);
                setDraft(null);
                viewport.current?.reset();
              }}
            >
              {mapName(slug)}
            </button>
          ))}
        </nav>
      </header>
      <div className="stripes stripes--thin" aria-hidden="true" />

      <main className="container calibrate__main">
        <div className="calibrate__stage">
          <p className="calibrate__help">
            Pick a character on the right, then <strong>drag a rectangle</strong> around them. Scroll to zoom, hold space to pan. Coordinates are saved as fractions of the image (0–1).
          </p>
          <div className="calibrate__frame" style={{ aspectRatio: size ? `${size.width} / ${size.height}` : '2560 / 1644' }}>
            <Viewport
              ref={viewport}
              aspect={aspect}
              label={`${mapName(map)} scene. Drag to draw a rectangle around ${CHARACTER_NAMES[character]}.`}
              className="calibrate__viewport"
              shouldPan={shouldPan}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              image={({ view, content }) => (
                <MapPicture
                  slug={map}
                  alt=""
                  eager
                  sizes={`${Math.ceil((content.width * view.scale) / 100) * 100}px`}
                  className="viewport__picture"
                  imgClassName="viewport__image"
                />
              )}
              overlay={({ toStage }) => (
                <>
                  {CHARACTER_SLUGS.map((slug) => {
                    const rect = slug === character && draft ? draft : mapRects[slug];
                    if (!rect) return null;
                    const topLeft = toStage(rect.x, rect.y);
                    const bottomRight = toStage(rect.x + rect.width, rect.y + rect.height);
                    const color = CHARACTER_COLORS[slug];
                    return (
                      <div
                        key={slug}
                        className="hitbox"
                        style={{
                          left: topLeft.x,
                          top: topLeft.y,
                          width: bottomRight.x - topLeft.x,
                          height: bottomRight.y - topLeft.y,
                          borderColor: color,
                          borderStyle: slug === character && draft ? 'dashed' : 'solid',
                        }}
                      >
                        <span className="hitbox__label" style={{ background: color }}>
                          {CHARACTER_NAMES[slug]}
                        </span>
                      </div>
                    );
                  })}
                  {pointer && (
                    <span className="calibrate__readout num">
                      x {pointer.x.toFixed(3)} · y {pointer.y.toFixed(3)}
                    </span>
                  )}
                </>
              )}
            />
          </div>
        </div>

        <aside className="calibrate__side">
          <h2 className="calibrate__heading">Characters</h2>
          <ul className="calibrate__list">
            {CHARACTER_SLUGS.map((slug) => {
              const { text, tone } = status(slug);
              return (
                <li key={slug}>
                  <button
                    type="button"
                    className={`calibrate__char${slug === character ? ' is-active' : ''}`}
                    aria-pressed={slug === character}
                    onClick={() => setCharacter(slug)}
                  >
                    <img src={characterImage(slug, 'webp')} alt="" style={{ borderColor: CHARACTER_COLORS[slug] }} />
                    <span className="calibrate__char-text">
                      <span className="calibrate__char-name">{CHARACTER_NAMES[slug]}</span>
                      <span className="calibrate__coords num">{slug === character && draft ? 'drawing…' : formatCoords(mapRects[slug]) || 'not drawn'}</span>
                    </span>
                    <span className={`calibrate__status ${tone}`}>{text}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="btn-row calibrate__tools">
            <button type="button" className="btn btn--outline btn--small" onClick={() => setRect(map, character, null)} disabled={!mapRects[character]}>
              Clear selected
            </button>
            <button
              type="button"
              className="btn btn--text btn--small calibrate__reset"
              onClick={() => setRects((current) => ({ ...current, [map]: {} }))}
            >
              Reset scene
            </button>
          </div>
        </aside>

        <section className="calibrate__output" aria-labelledby="json-title">
          <div className="calibrate__output-head">
            <h2 id="json-title" className="calibrate__heading">
              hitboxes.json
            </h2>
            <div className="btn-row">
              <button type="button" className="btn btn--outline btn--small" onClick={copy}>
                {copied ? 'Copied' : 'Copy JSON'}
              </button>
              <button type="button" className="btn btn--primary btn--small" onClick={download}>
                Download file
              </button>
            </div>
          </div>
          <pre className="calibrate__json" tabIndex={0}>
            {json}
          </pre>
          <p className="hint">
            {placeholders > 0 ? `${placeholders} of ${MAP_SLUGS.length * CHARACTER_SLUGS.length} rectangles are still placeholders (calibrated: false). ` : 'Every rectangle is calibrated. '}
            Replace <code>api/prisma/data/hitboxes.json</code> with the downloaded file and run <code>npm run seed -w api</code>. This page only exists in development.
          </p>
          <Link to="/" className="more-link">
            Back to the game
          </Link>
        </section>
      </main>
    </div>
  );
}
