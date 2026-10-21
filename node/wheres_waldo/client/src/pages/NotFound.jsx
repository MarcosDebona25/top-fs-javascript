import { useEffect } from 'react';
import { Link } from 'react-router';
import { characterImage } from '../lib/maps.js';

export default function NotFound() {
  useEffect(() => {
    document.title = "Page not found · Where's Waldo?";
  }, []);

  return (
    <div className="container not-found">
      <div className="not-found__text">
        <p className="not-found__code display" aria-hidden="true">
          404
        </p>
        <h1 className="display not-found__title">Even Waldo can't find this page.</h1>
        <p className="not-found__copy">The page you're looking for doesn't exist or was moved. Let's get you back to the beach.</p>
        <div className="btn-row not-found__actions">
          <Link to="/#maps" className="btn btn--primary">
            Back to the scenes
          </Link>
          <Link to="/ranking" className="btn btn--text">
            See the leaderboard
          </Link>
        </div>
      </div>
      <img
        className="not-found__art"
        src={characterImage('wizard', 'webp')}
        alt="Wizard Whitebeard, looking lost"
        width="300"
        height="340"
      />
    </div>
  );
}
