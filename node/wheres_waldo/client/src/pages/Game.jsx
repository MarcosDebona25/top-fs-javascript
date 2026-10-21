import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useAuth } from '../auth.jsx';
import { MapPicture } from '../components/MapPicture.jsx';
import { BackIcon, BigCheckIcon, ClockIcon, CrossIcon, FoundBadge, MinusIcon, PersonIcon, PlusIcon, PointerIcon } from '../components/icons.jsx';
import { Viewport } from '../components/Viewport.jsx';
import { useMediaQuery } from '../hooks/useMediaQuery.js';
import { useResource } from '../hooks/useResource.js';
import { useStopwatch } from '../hooks/useStopwatch.js';
import { api } from '../lib/api.js';
import { characterImage, mapName, sceneLabel } from '../lib/maps.js';
import { clamp } from '../lib/rect.js';
import { formatPenalty, formatSecondsShort, formatTime, pluralize } from '../lib/time.js';
import NotFound from './NotFound.jsx';

const MENU_WIDTH = 232;
const MENU_ROW = 52;
const RING = 88;
const SHEET_CLEARANCE = 260;

function Portrait({ slug, size = 40, ...rest }) {
  return <img src={characterImage(slug, 'webp')} alt="" width={size} height={size} {...rest} />;
}

// What went wrong with a guess or a start, in words for the player.
export function describeGameError(error) {
  if (error.status === 429) return 'Slow down a little, then try again.';
  if (error.status === 401) return 'Your session ended. Log in again to keep playing.';
  return error.message || 'Something went wrong. Try again.';
}

function ReadyModal({ map, user, authReady, onStart, starting, error, devWarning }) {
  const startRef = useRef(null);
  const navigate = useNavigate();
  useEffect(() => {
    startRef.current?.focus();
  }, [authReady]);
  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && navigate('/');
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  return (
    <div className="ready">
      <div className="ready__veil" aria-hidden="true" />
      <div className="ready__dialog" role="dialog" aria-modal="true" aria-labelledby="ready-title">
        <div className="ready__head">
          <span className="eyebrow ready__eyebrow">{sceneLabel(map.slug)}</span>
          <h1 id="ready-title" className="display ready__title">
            Find all five characters
          </h1>
        </div>
        <ul className="ready__cast">
          {map.characters.map((character) => (
            <li key={character.slug}>
              <picture>
                <source type="image/webp" srcSet={`/img/characters/${character.slug}.webp`} />
                <img src={characterImage(character.slug)} alt={character.name} />
              </picture>
              <span>{character.name}</span>
            </li>
          ))}
        </ul>
        <ul className="ready__rules">
          <li>
            <ClockIcon />
            <span>
              <strong>Every wrong guess adds +1 second</strong> to your final time.
            </span>
          </li>
          <li>
            <PointerIcon />
            <span>Click the picture, then choose who you found. Zoom and drag to look closer.</span>
          </li>
          {authReady && user && (
            <li className="is-ok">
              <BigCheckIcon />
              <span>
                Playing as <strong>{user.username}</strong>. Your best time goes on the leaderboard.
              </span>
            </li>
          )}
          {authReady && !user && (
            <li className="is-guest">
              <PersonIcon />
              <span>
                Playing as a guest: you'll see your time, but it won't be saved. <Link to="/login" state={{ from: `/play/${map.slug}` }}>Log in</Link> to compete.
              </span>
            </li>
          )}
        </ul>
        {devWarning && (
          <p className="ready__dev">
            Dev note: the hitboxes for this scene are placeholders, so the characters can't be found where they really are yet. <Link to="/dev/calibrate">Open the calibration tool</Link>.
          </p>
        )}
        {error && (
          <p className="msg msg--error" role="alert">
            {error}
          </p>
        )}
        <div className="btn-row">
          <button ref={startRef} type="button" className="btn btn--primary ready__start" onClick={onStart} disabled={!authReady || starting}>
            {starting ? 'Starting…' : 'Start — the clock begins now'}
          </button>
          <Link to="/" className="btn btn--text">
            Back to scenes
          </Link>
        </div>
      </div>
    </div>
  );
}

function CharacterMenu({ pending, onChoose, onCancel, stageSize, anchor, narrow }) {
  const first = useRef(null);
  useEffect(() => {
    first.current?.focus({ preventScroll: true });
  }, []);

  if (narrow) {
    return (
      <div className="sheet" role="dialog" aria-label="Who is here?" data-no-pan>
        <span className="sheet__grip" aria-hidden="true" />
        <div className="sheet__head">
          <span className="sheet__title">Who's here?</span>
          <button type="button" className="sheet__cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
        <div className="sheet__grid">
          {pending.map((character, index) => (
            <button key={character.slug} ref={index === 0 ? first : undefined} type="button" className="sheet__choice" onClick={() => onChoose(character)}>
              <Portrait slug={character.slug} size={56} />
              {character.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const height = 40 + pending.length * MENU_ROW + 16;
  const flip = anchor.x + 60 + MENU_WIDTH > stageSize.width - 8;
  const left = flip ? anchor.x - 60 - MENU_WIDTH : anchor.x + 60;
  const top = clamp(anchor.y - 64, 8, Math.max(8, stageSize.height - height - 8));
  return (
    <div className="menu" role="menu" aria-label="Who is here?" style={{ left, top, width: MENU_WIDTH }} data-no-pan>
      <p className="menu__title">Who's here?</p>
      {pending.map((character, index) => (
        <button key={character.slug} ref={index === 0 ? first : undefined} type="button" role="menuitem" className="menu__item" onClick={() => onChoose(character)}>
          <Portrait slug={character.slug} size={36} />
          {character.name}
        </button>
      ))}
    </div>
  );
}

export default function Game() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, status: authStatus } = useAuth();
  const { data: mapsData, error: mapsError } = useResource((signal) => api.maps({ signal }), []);
  const map = mapsData?.maps.find((entry) => entry.slug === slug);

  const [phase, setPhase] = useState('ready'); // ready | starting | playing
  const [startError, setStartError] = useState(null);
  const [game, setGame] = useState(null);
  const [found, setFound] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [misses, setMisses] = useState({ count: 0, penaltyMs: 0 });
  const [selection, setSelection] = useState(null);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const [missMark, setMissMark] = useState(null);
  const [scale, setScale] = useState(1);
  const viewport = useRef(null);
  const narrow = useMediaQuery('(max-width: 700px)');

  const playing = phase === 'playing';
  const elapsed = useStopwatch({ startedAt: game?.startedAt, serverTime: game?.serverTime, penaltyMs: misses.penaltyMs, running: playing });

  useEffect(() => {
    if (map) document.title = `${map.name} · Where's Waldo?`;
  }, [map]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), toast.kind === 'error' ? 4200 : 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!missMark) return undefined;
    const timer = setTimeout(() => setMissMark(null), 900);
    return () => clearTimeout(timer);
  }, [missMark]);

  useEffect(() => {
    if (!selection) return undefined;
    const onKey = (event) => event.key === 'Escape' && setSelection(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selection]);

  const start = useCallback(async () => {
    setPhase('starting');
    setStartError(null);
    try {
      const { game: started } = await api.startGame(slug);
      setGame(started);
      setFound(started.found);
      setMisses({ count: started.wrongCount, penaltyMs: started.penaltyMs });
      setPhase('playing');
    } catch (error) {
      setStartError(describeGameError(error));
      setPhase('ready');
    }
  }, [slug]);

  const onPick = useCallback(
    (point, stagePoint, stageSize) => {
      if (!playing || sending) return;
      setSelection({ x: point.x, y: point.y });
      // On a phone the picker is a sheet over the bottom of the picture: keep the ring clear of it.
      if (narrow && viewport.current) {
        const limit = stageSize.height - SHEET_CLEARANCE;
        if (limit > 0 && stagePoint.y > limit) viewport.current.panBy(0, limit - stagePoint.y);
      }
    },
    [playing, sending, narrow],
  );

  const choose = useCallback(
    async (character) => {
      if (!selection || !game || sending) return;
      const point = selection;
      setSelection(null);
      setSending(true);
      try {
        const reply = await api.guess(game.id, { character: character.slug, x: point.x, y: point.y });
        setFound(reply.found);
        setMisses({ count: reply.wrongCount, penaltyMs: reply.penaltyMs });
        if (reply.correct) {
          if (!reply.alreadyFound) setMarkers((current) => [...current, { slug: character.slug, name: character.name, ...point }]);
          if (reply.completed) {
            navigate(`/result/${game.id}`, { replace: true });
            return;
          }
          setToast({ kind: 'found', text: `Found ${character.name}!`, key: Date.now() });
        } else {
          setMissMark({ ...point, key: Date.now() });
          setToast({ kind: 'miss', text: `Not here — ${formatSecondsShort(game.wrongGuessPenaltyMs)}`, key: Date.now() });
        }
      } catch (error) {
        if (error.code === 'GAME_TOO_FAST' || error.code === 'GAME_FINISHED') {
          navigate(`/result/${game.id}`, { replace: true });
          return;
        }
        setToast({ kind: 'error', text: describeGameError(error), key: Date.now() });
      } finally {
        setSending(false);
      }
    },
    [selection, game, sending, navigate],
  );

  const pending = useMemo(() => (map ? map.characters.filter((character) => !found.includes(character.slug)) : []), [map, found]);

  if (mapsError && !mapsData) {
    return (
      <div className="container load-error" role="alert" style={{ paddingTop: 48 }}>
        <p>{mapsError.message}</p>
        <Link to="/" className="btn btn--outline btn--small">
          Back to scenes
        </Link>
      </div>
    );
  }
  if (mapsData && !map) return <NotFound />;
  if (!map) {
    return (
      <p className="loading container" role="status" style={{ paddingTop: 48 }}>
        Loading the scene…
      </p>
    );
  }

  const aspect = map.imageHeight / map.imageWidth;

  return (
    <div className="game">
      <header className="hud">
        <div className="hud__left">
          <Link to="/" className="hud__back" aria-label="Back to scenes">
            <BackIcon />
            <span className="hud__back-text">Scenes</span>
          </Link>
          <span className="hud__map">{map.name}</span>
        </div>

        <ul className="hud__cast" aria-label="Characters to find">
          {map.characters.map((character) => {
            const isFound = found.includes(character.slug);
            return (
              <li key={character.slug} className={`hud__char${isFound ? ' is-found' : ''}`} title={`${character.name} ${isFound ? 'found' : 'still hidden'}`}>
                <Portrait slug={character.slug} />
                {isFound && <FoundBadge />}
                <span className="sr-only">
                  {character.name} {isFound ? 'found' : 'still hidden'}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="hud__right">
          <div className="hud__clock">
            <span className="hud__time num" role="timer" aria-label="Elapsed time">
              {formatTime(elapsed)}
            </span>
            <span className={`hud__penalty num${misses.count ? ' has-misses' : ''}`}>
              {misses.count ? (
                <>
                  {formatPenalty(misses.penaltyMs)}
                  <span className="hide-narrow"> penalty</span> · {pluralize(misses.count, 'miss', 'misses')}
                </>
              ) : (
                'No misses yet'
              )}
            </span>
          </div>
          <div className="hud__zoom" role="group" aria-label="Zoom">
            <button type="button" aria-label="Zoom out" onClick={() => viewport.current?.zoomBy(0.8)}>
              <MinusIcon />
            </button>
            <span className="num hud__zoom-level" aria-live="off">
              {Math.round(scale * 100)}%
            </span>
            <button type="button" aria-label="Zoom in" onClick={() => viewport.current?.zoomBy(1.25)}>
              <PlusIcon />
            </button>
          </div>
          <button type="button" className="btn btn--outline btn--small hud__quit" onClick={() => navigate('/')}>
            Quit
          </button>
        </div>
      </header>
      <div className="stripes stripes--thin" aria-hidden="true" />

      <div className="stage-wrap">
        <Viewport
          ref={viewport}
          aspect={aspect}
          label={`${map.name} scene to search. Drag to move, scroll or pinch to zoom, press Enter to pick the centre.`}
          className={playing ? 'is-playing' : ''}
          onPick={playing ? onPick : undefined}
          onViewChange={(view) => setScale(view.scale)}
          image={({ view, content }) => (
            <MapPicture
              slug={map.slug}
              alt={`${map.name} scene to search`}
              width={map.imageWidth}
              height={map.imageHeight}
              eager
              sizes={`${Math.ceil((content.width * view.scale) / 100) * 100}px`}
              className="viewport__picture"
              imgClassName="viewport__image"
            />
          )}
          overlay={({ toStage, stage }) => (
            <>
              {markers.map((marker) => {
                const at = toStage(marker.x, marker.y);
                return (
                  <div key={marker.slug} className="marker" style={{ left: at.x, top: at.y }}>
                    <span className="marker__ring" />
                    <span className="marker__label">{marker.name}</span>
                  </div>
                );
              })}
              {missMark && (
                <span key={missMark.key} className="miss-mark" style={{ left: toStage(missMark.x, missMark.y).x, top: toStage(missMark.x, missMark.y).y }}>
                  <CrossIcon size={22} />
                </span>
              )}
              {selection && (
                <>
                  <span className="ring" aria-hidden="true" style={{ left: toStage(selection.x, selection.y).x - RING / 2, top: toStage(selection.x, selection.y).y - RING / 2 }} />
                  <span className="ring-dot" aria-hidden="true" style={{ left: toStage(selection.x, selection.y).x - 3, top: toStage(selection.x, selection.y).y - 3 }} />
                  <CharacterMenu
                    pending={pending}
                    onChoose={choose}
                    onCancel={() => setSelection(null)}
                    stageSize={stage}
                    anchor={toStage(selection.x, selection.y)}
                    narrow={narrow}
                  />
                </>
              )}
            </>
          )}
        />
        <div className="zoom-float" role="group" aria-label="Zoom">
          <button type="button" aria-label="Zoom in" onClick={() => viewport.current?.zoomBy(1.25)}>
            <PlusIcon />
          </button>
          <button type="button" aria-label="Zoom out" onClick={() => viewport.current?.zoomBy(0.8)}>
            <MinusIcon />
          </button>
        </div>
        <div className="toast-region" role="status" aria-live="polite">
          {toast && (
            <p key={toast.key} className={`toast toast--${toast.kind}`}>
              {toast.kind === 'miss' && <CrossIcon />}
              {toast.kind === 'found' && <BigCheckIcon size={18} />}
              <span className="num">{toast.text}</span>
            </p>
          )}
        </div>
        {phase !== 'playing' && (
          <ReadyModal
            map={map}
            user={user}
            authReady={authStatus === 'ready'}
            starting={phase === 'starting'}
            onStart={start}
            error={startError}
            devWarning={import.meta.env.DEV && map.calibrated === false}
          />
        )}
      </div>
      <span className="sr-only" aria-live="polite">
        {playing ? `${mapName(slug)}: ${found.length} of ${map.characters.length} found` : ''}
      </span>
    </div>
  );
}
