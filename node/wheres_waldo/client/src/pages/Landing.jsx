import { useEffect } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../auth.jsx';
import { GlobalBoard, TopList } from '../components/Leaderboards.jsx';
import { MapPicture } from '../components/MapPicture.jsx';
import { useLeaderboardStream } from '../hooks/useLeaderboardStream.js';
import { useResource } from '../hooks/useResource.js';
import { api } from '../lib/api.js';
import { CHARACTER_SLUGS, MAP_SLUGS, mapName } from '../lib/maps.js';
import { formatTime } from '../lib/time.js';

const CHARACTER_NAMES = { waldo: 'Waldo', woof: 'Woof', wenda: 'Wenda', wizard: 'Wizard Whitebeard', odlaw: 'Odlaw' };

function LoadError({ error, onRetry }) {
  return (
    <div className="load-error" role="alert">
      <p>{error.message}</p>
      <button type="button" className="btn btn--outline btn--small" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const { data, error, reload } = useResource(
    async (signal) => {
      const [summary, maps] = await Promise.all([api.summary({ signal }), api.maps({ signal })]);
      return { summary, maps: maps.maps };
    },
    [],
  );
  useLeaderboardStream(reload);

  useEffect(() => {
    document.title = "Where's Waldo? Find all five before the clock does";
  }, []);

  const bestTimes = Object.fromEntries((data?.maps ?? []).map((map) => [map.slug, map.bestTimeMs]));
  const username = user?.username;

  return (
    <>
      <section className="container hero">
        <div className="hero__text">
          <p className="eyebrow hero__eyebrow">Five characters · Three scenes · One clock</p>
          <h1 className="display hero__title">Can you find all five before the clock does?</h1>
          <p className="lede">
            {user
              ? `Welcome back, ${user.username}. Every run you finish is saved, and your best time on each scene goes on the leaderboard.`
              : 'Play as a guest whenever you like. Create an account to put your times on the global leaderboard.'}
          </p>
          <div className="btn-row">
            {user ? (
              <>
                <a href="#maps" className="btn btn--primary">
                  Pick a scene
                </a>
                <Link to="/ranking" className="btn btn--outline">
                  See the leaderboard
                </Link>
              </>
            ) : (
              <>
                <Link to="/signup" className="btn btn--primary">
                  Create account
                </Link>
                <a href="#maps" className="btn btn--outline">
                  Play as guest
                </a>
              </>
            )}
          </div>
        </div>
        <ul className="cast" aria-label="The five characters">
          {CHARACTER_SLUGS.map((slug) => (
            <li key={slug} className="cast__member">
              <picture>
                <source type="image/webp" srcSet={`/img/characters/${slug}.webp`} />
                <img src={`/img/characters/${slug}.png`} alt="" height="180" loading="eager" />
              </picture>
              <span>{CHARACTER_NAMES[slug]}</span>
            </li>
          ))}
        </ul>
      </section>

      <section id="maps" className="container section" aria-labelledby="maps-title">
        <h2 id="maps-title" className="section-title">
          Pick a scene
        </h2>
        <div className="map-cards">
          {MAP_SLUGS.map((slug) => (
            <Link key={slug} to={`/play/${slug}`} className="map-card">
              <MapPicture
                slug={slug}
                alt=""
                sizes="(min-width: 1000px) 380px, (min-width: 640px) 45vw, 92vw"
                width="1024"
                height="683"
                widths={[640, 1024, 1600]}
                imgClassName="map-card__image"
              />
              <span className="map-card__meta">
                <span className="map-card__name">{mapName(slug)}</span>
                <span className="num map-card__best">Best {formatTime(bestTimes[slug] ?? null)}</span>
              </span>
              <span className="sr-only">Play {mapName(slug)}</span>
            </Link>
          ))}
        </div>
      </section>

      <section id="leaderboard" className="container section" aria-labelledby="global-title">
        <h2 id="global-title" className="section-title">
          Global leaderboard
        </h2>
        {error && !data ? (
          <LoadError error={error} onRetry={reload} />
        ) : !data ? (
          <p className="loading" role="status">
            Loading the leaderboard…
          </p>
        ) : (
          <>
            <GlobalBoard rows={data.summary.global.rows} username={username} />
            <Link to="/ranking" className="more-link">
              View full ranking
            </Link>
          </>
        )}
      </section>

      {data && (
        <section className="container top-lists" aria-label="Fastest times per scene">
          {data.summary.maps.map((map) => (
            <TopList key={map.slug} slug={map.slug} name={map.name} rows={map.rows} username={username} />
          ))}
        </section>
      )}
    </>
  );
}
