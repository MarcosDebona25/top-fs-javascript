import { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { useAuth } from '../auth.jsx';
import { GlobalBoard, MapBoard } from '../components/Leaderboards.jsx';
import { Pagination } from '../components/Pagination.jsx';
import { useLeaderboardStream } from '../hooks/useLeaderboardStream.js';
import { useResource } from '../hooks/useResource.js';
import { api } from '../lib/api.js';
import { MAP_SLUGS, mapName } from '../lib/maps.js';
import NotFound from './NotFound.jsx';

const PAGE_SIZE = 10;

const TABS = [{ slug: undefined, label: 'Global', to: '/ranking' }, ...MAP_SLUGS.map((slug) => ({ slug, label: mapName(slug), to: `/ranking/${slug}` }))];

export function parsePage(value) {
  const page = Number.parseInt(value ?? '', 10);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

export default function Ranking() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const page = parsePage(searchParams.get('page'));
  const known = slug === undefined || MAP_SLUGS.includes(slug);

  const { data, error, loading, reload } = useResource(
    (signal) => (slug ? api.mapBoard(slug, { page, pageSize: PAGE_SIZE }, { signal }) : api.globalBoard({ page, pageSize: PAGE_SIZE }, { signal })),
    [slug ?? 'global', page, known],
  );
  const live = useLeaderboardStream(reload);

  const title = slug ? `${mapName(slug)} ranking` : 'Leaderboard';
  useEffect(() => {
    document.title = `${title} · Where's Waldo?`;
  }, [title]);

  if (!known) return <NotFound />;

  const base = slug ? `/ranking/${slug}` : '/ranking';
  const hrefFor = (target) => (target === 1 ? base : `${base}?page=${target}`);
  const first = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0;
  const last = data ? Math.min(data.total, (data.page - 1) * data.pageSize + data.rows.length) : 0;

  return (
    <div className="container ranking">
      <div className="ranking__head">
        <h1 className="display ranking__title">Leaderboard</h1>
        {live && (
          <span className="live-badge" role="status">
            <span className="live-badge__dot" aria-hidden="true" />
            Updating live
          </span>
        )}
      </div>

      <nav className="tabs" aria-label="Leaderboards">
        {TABS.map((tab) => {
          const current = tab.slug === slug;
          return (
            <Link key={tab.label} to={tab.to} className="tabs__link" aria-current={current ? 'page' : undefined}>
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {error && !data ? (
        <div className="load-error" role="alert">
          <p>{error.message}</p>
          <button type="button" className="btn btn--outline btn--small" onClick={reload}>
            Try again
          </button>
        </div>
      ) : !data ? (
        <p className="loading" role="status">
          {loading ? 'Loading the ranking…' : ''}
        </p>
      ) : (
        <>
          {slug ? (
            <MapBoard rows={data.rows} username={user?.username} name={mapName(slug)} />
          ) : (
            <GlobalBoard rows={data.rows} username={user?.username} className="board--ranking" />
          )}
          <div className="ranking__foot">
            <p className="num ranking__count">
              {data.total === 0 ? 'No players yet' : `Showing ${first}–${last} of ${data.total} ${data.total === 1 ? 'player' : 'players'}`}
            </p>
            <Pagination page={data.page} totalPages={data.totalPages} hrefFor={hrefFor} />
          </div>
        </>
      )}

      <p className="hint ranking__note">
        {slug
          ? `Each player's fastest time on ${mapName(slug)} counts, wrong guesses included.`
          : 'Players are ranked by how many scenes they completed, then by their total time. A "—" means that scene hasn\'t been completed yet.'}
      </p>
    </div>
  );
}
