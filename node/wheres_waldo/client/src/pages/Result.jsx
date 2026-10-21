import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import { useAuth } from '../auth.jsx';
import { BigCheckIcon } from '../components/icons.jsx';
import { MapBoard } from '../components/Leaderboards.jsx';
import { useResource } from '../hooks/useResource.js';
import { api } from '../lib/api.js';
import { mapName, nextMapSlug } from '../lib/maps.js';
import { formatTime, pluralize } from '../lib/time.js';
import NotFound from './NotFound.jsx';

const BOARD_ROWS = 5;

export function Breakdown({ result }) {
  const searching = formatTime(result.elapsedMs);
  if (result.wrongCount === 0) return <>{searching} searching, no wrong guesses</>;
  return (
    <>
      {searching} searching + {formatTime(result.penaltyMs)} for {pluralize(result.wrongCount, 'wrong guess', 'wrong guesses')}
    </>
  );
}

function Rank({ label, rank, note, accent }) {
  return (
    <div className="rank-block">
      <span className="rank-block__label">{label}</span>
      <span className={`rank-block__value num${accent ? ' is-accent' : ''}`}>#{rank}</span>
      <span className="rank-block__note">{note}</span>
    </div>
  );
}

function Header({ children }) {
  return <p className="eyebrow">{children}</p>;
}

export default function Result() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data, error } = useResource(
    async (signal) => {
      const { game } = await api.game(id, { signal });
      if (game.status === 'in_progress') return { game };
      const board = await api.mapBoard(game.mapSlug, { page: 1, pageSize: BOARD_ROWS }, { signal });
      return { game, board };
    },
    [id],
  );

  const game = data?.game;
  useEffect(() => {
    document.title = game ? `Result · ${mapName(game.mapSlug)} · Where's Waldo?` : "Result · Where's Waldo?";
  }, [game]);

  if (error && !data) {
    if (error.status === 404 || error.status === 422) return <NotFound />;
    return (
      <div className="container result-message" role="alert">
        <h1 className="display">{error.status === 401 ? 'Log in to see this result' : "We couldn't load this result"}</h1>
        <p>{error.status === 401 ? 'This run belongs to a player account.' : error.message}</p>
        <div className="btn-row">
          {error.status === 401 && (
            <Link to="/login" state={{ from: `/result/${id}` }} className="btn btn--primary">
              Log in
            </Link>
          )}
          <Link to="/" className="btn btn--outline">
            Back to scenes
          </Link>
        </div>
      </div>
    );
  }
  if (!data) {
    return (
      <p className="loading container" role="status" style={{ paddingTop: 48 }}>
        Loading your result…
      </p>
    );
  }
  if (game.status === 'in_progress') return <Navigate to={`/play/${game.mapSlug}`} replace />;

  const name = mapName(game.mapSlug);
  if (game.status === 'abandoned') {
    return (
      <div className="container result-message">
        <h1 className="display">No time recorded</h1>
        <p>You left {name} before finding all five characters, so this run was not saved.</p>
        <div className="btn-row">
          <Link to={`/play/${game.mapSlug}`} className="btn btn--primary">
            Play {name} again
          </Link>
          <Link to="/" className="btn btn--outline">
            Back to scenes
          </Link>
        </div>
      </div>
    );
  }

  const { result } = game;
  const rejected = game.status === 'rejected';
  const next = nextMapSlug(game.mapSlug);
  const best = data.board.rows[0];
  const registered = result.ranked;

  return (
    <>
      <section className={`container result${registered ? ' result--user' : ''}`}>
        <div className="result__time">
          <Header>{rejected ? `${name} · not counted` : `${name} · all five found`}</Header>
          <h1 className="result__big num" aria-label={`Your time: ${formatTime(result.durationMs)}`}>
            {formatTime(result.durationMs)}
          </h1>
          <p className="result__breakdown num">
            <Breakdown result={result} />
          </p>
          {registered && (
            <p className={`result__note${result.personalBest ? ' is-good' : ''}`}>
              {result.personalBest && <BigCheckIcon />}
              {result.personalBest
                ? 'New personal best'
                : `Not your best: your fastest run on ${name} is still the one on the board.`}
            </p>
          )}
          {!registered && !rejected && (
            <div className="btn-row result__again">
              <Link to={`/play/${game.mapSlug}`} className="btn btn--outline">
                Play again
              </Link>
              <Link to="/#maps" className="btn btn--text">
                Try another scene →
              </Link>
            </div>
          )}
        </div>

        {rejected && (
          <div className="result__aside">
            <h2 className="result__aside-title">That run was too fast to count.</h2>
            <p>
              Finishing a scene this quickly can't be checked, so the time isn't saved or ranked. Take your time and give it another go.
            </p>
            <div className="btn-row">
              <Link to={`/play/${game.mapSlug}`} className="btn btn--primary">
                Play {name} again
              </Link>
              <Link to="/#maps" className="btn btn--text">
                Try another scene →
              </Link>
            </div>
          </div>
        )}

        {registered && (
          <div className="result__aside">
            <div className="rank-row">
              <Rank
                label={`${name} rank`}
                rank={result.mapPosition?.rank}
                note={`of ${pluralize(result.mapPosition?.total ?? 0, 'player')}`}
                accent
              />
              <Rank label="Global rank" rank={result.globalPosition?.rank} note={`of ${pluralize(result.globalPosition?.total ?? 0, 'player')}`} />
            </div>
            <div className="btn-row">
              <Link to={`/play/${next}`} className="btn btn--primary">
                Next: {mapName(next)}
              </Link>
              <Link to={`/play/${game.mapSlug}`} className="btn btn--outline">
                Play {name} again
              </Link>
            </div>
          </div>
        )}

        {!registered && !rejected && (
          <div className="result__aside result__aside--guest">
            <h2 className="result__aside-title">You played as a guest, so this time isn't saved.</h2>
            <p>
              Create a free account (just a username and a password) and your best time on each scene goes on the global leaderboard. Your next run will
              count.
            </p>
            <div className="btn-row">
              <Link to="/signup" state={{ from: `/play/${game.mapSlug}` }} className="btn btn--primary">
                Create account
              </Link>
              <Link to="/login" state={{ from: `/play/${game.mapSlug}` }} className="btn btn--text">
                I already have one, log in
              </Link>
            </div>
          </div>
        )}
      </section>

      {registered ? (
        <section className="container section" aria-labelledby="result-board">
          <h2 id="result-board" className="section-title section-title--sm">
            {name} leaderboard
          </h2>
          <MapBoard rows={data.board.rows} username={user?.username} name={name} />
          <Link to={`/ranking/${game.mapSlug}`} className="more-link">
            Full {name} ranking
          </Link>
        </section>
      ) : (
        <section className="container section result__best" aria-labelledby="result-best">
          <h2 id="result-best" className="section-title section-title--sm">
            Beat the best on {name}
          </h2>
          <p className="num result__best-copy">
            {best ? (
              <>
                The fastest player right now is <strong>{best.username}</strong> at <strong>{formatTime(best.timeMs)}</strong>.
              </>
            ) : (
              <>Nobody has a time on {name} yet. The board is waiting for you.</>
            )}
          </p>
          <Link to={`/ranking/${game.mapSlug}`} className="more-link">
            See the {name} leaderboard
          </Link>
        </section>
      )}
    </>
  );
}
