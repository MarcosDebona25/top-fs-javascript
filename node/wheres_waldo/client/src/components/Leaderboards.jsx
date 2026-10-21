import { Link } from 'react-router';
import { camelCase, MAP_SLUGS, mapName } from '../lib/maps.js';
import { formatTime } from '../lib/time.js';

function YouBadge() {
  return <span className="you-badge">You</span>;
}

// Player | Beach | Ski Slopes | Moon Base | Total, with "n/a" where a scene is not finished yet.
export function GlobalBoard({ rows, username, className = '' }) {
  return (
    <div className="table-wrap">
      <table className={`board board--global num ${className}`}>
        <caption className="sr-only">Global leaderboard</caption>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Player</th>
            {MAP_SLUGS.map((slug) => (
              <th key={slug} scope="col" className="right">
                {mapName(slug)}
              </th>
            ))}
            <th scope="col" className="right">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={2 + MAP_SLUGS.length + 1} className="empty">
                No times yet. Be the first on the board.
              </td>
            </tr>
          )}
          {rows.map((row) => {
            const you = username && row.username === username;
            return (
              <tr key={row.username} className={you ? 'is-you' : undefined}>
                <td className="rank">{row.rank}</td>
                <td>
                  {row.username}
                  {you && <YouBadge />}
                </td>
                {MAP_SLUGS.map((slug) => (
                  <td key={slug} className="right">
                    {formatTime(row.times[camelCase(slug)])}
                  </td>
                ))}
                <td className="right total">{formatTime(row.totalMs)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// # | Player | Time for one scene.
export function MapBoard({ rows, username, name }) {
  return (
    <div className="table-wrap">
      <table className="board board--map num">
        <caption className="sr-only">{name} leaderboard</caption>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Player</th>
            <th scope="col" className="right">
              Time
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} className="empty">
                Nobody has finished {name} yet.
              </td>
            </tr>
          )}
          {rows.map((row) => {
            const you = username && row.username === username;
            return (
              <tr key={row.username} className={you ? 'is-you' : undefined}>
                <td className="rank">{row.rank}</td>
                <td>
                  {row.username}
                  {you && <YouBadge />}
                </td>
                <td className="right total">{formatTime(row.timeMs)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// The compact top list under the landing page: navy title bar, zebra rows, link aligned to the bottom.
export function TopList({ slug, name, rows, username }) {
  return (
    <section className="map-board" aria-labelledby={`top-${slug}`}>
      <h3 className="map-board__title" id={`top-${slug}`}>
        {name}
      </h3>
      {rows.length === 0 ? (
        <p className="map-board__empty">Nobody has finished this scene yet.</p>
      ) : (
        <ol className="map-board__list num">
          {rows.map((row) => (
            <li key={row.username} className={`map-board__row${username && row.username === username ? ' is-you' : ''}`}>
              <span>
                <span className="map-board__rank">{row.rank}</span>
                {row.username}
              </span>
              <span>{formatTime(row.timeMs)}</span>
            </li>
          ))}
        </ol>
      )}
      <Link to={`/ranking/${slug}`} className="map-board__link">
        Full {name} ranking
      </Link>
    </section>
  );
}
