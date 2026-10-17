import { Link, NavLink, useLocation } from 'react-router';
import { useAuth } from '@blog/shared/auth';
import { returnTo } from '@blog/shared/returnTo';

export function Masthead() {
  const { status, user, logOut } = useAuth();
  const location = useLocation();

  return (
    <header className="wrap">
      <div className="mast-top">
        <span className="tagline">Notes on writing software</span>
        <nav className="nav" aria-label="Main">
          <NavLink to="/" end>
            Essays
          </NavLink>
          {status === 'authenticated' && (
            <>
              <span className="who">{user.username}</span>
              <button type="button" className="btn-link" onClick={logOut}>
                Log out
              </button>
            </>
          )}
          {status === 'anonymous' && (
            <>
              <NavLink to="/login" state={returnTo(location)}>
                Log in
              </NavLink>
              <NavLink to="/signup" state={returnTo(location)}>
                Sign up
              </NavLink>
            </>
          )}
        </nav>
      </div>
      <Link to="/" className="wordmark">
        Marginalia
      </Link>
      <p className="strip">
        <span>Vol. I</span>
        <span className="hl">Essays · Letters · Code</span>
        <span>Est. 2026</span>
      </p>
    </header>
  );
}
