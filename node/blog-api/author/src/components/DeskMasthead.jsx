import { Link, NavLink } from 'react-router';
import { readerUrl } from '../siteUrl.js';

export function DeskMasthead({ user, onLogOut }) {
  return (
    <header className="wrap">
      <div className="mast-top">
        <span className="tagline">The writers’ desk</span>
        <nav className="nav" aria-label="Main">
          {user && (
            <NavLink to="/" end>
              Your essays
            </NavLink>
          )}
          <a href={readerUrl()}>View the site</a>
          {user && (
            <>
              <span className="who">{user.username}</span>
              <button type="button" className="btn-link" onClick={onLogOut}>
                Log out
              </button>
            </>
          )}
        </nav>
      </div>
      <Link to="/" className="wordmark small">
        Marginalia
      </Link>
      <p className="strip">
        <span>The desk</span>
        <span className="hl">Write · Revise · Publish</span>
        <span>{user ? user.username : 'Authors only'}</span>
      </p>
    </header>
  );
}
