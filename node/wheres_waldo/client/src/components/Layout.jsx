import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../auth.jsx';
import { prefetchLogin, prefetchRanking, prefetchRegister } from '../lib/prefetch.js';
import { GitHubIcon } from './icons.jsx';

export function Brand() {
  return (
    <Link to="/" className="brand">
      <span className="brand__mark" aria-hidden="true" />
      <span className="brand__name">Where's Waldo?</span>
    </Link>
  );
}

export function Stripes({ thin = false }) {
  return <div className={thin ? 'stripes stripes--thin' : 'stripes'} aria-hidden="true" />;
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>
        <a href="https://github.com/MarcosDebona25" className="site-footer__link">
          <GitHubIcon />
          MarcosDebona25
        </a>
      </span>
    </footer>
  );
}

function AccountNav() {
  const { status, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (status === 'loading') return null;
  if (user) {
    return (
      <>
        <span className="nav__user btn btn--primary btn--small">{user.username}</span>
        <button
          type="button"
          className="btn btn--outline btn--small"
          onClick={async () => {
            await logout();
            navigate('/');
          }}
        >
          Log out
        </button>
      </>
    );
  }
  return (
    <>
      <Link
        to="/login"
        state={{ from: location.pathname }}
        className="nav__link"
        onMouseEnter={prefetchLogin}
        onFocus={prefetchLogin}
      >
        Log in
      </Link>
      <Link
        to="/signup"
        state={{ from: location.pathname }}
        className="btn btn--primary btn--small"
        onMouseEnter={prefetchRegister}
        onFocus={prefetchRegister}
      >
        Sign up
      </Link>
    </>
  );
}

// Header, striped band, page and footer. `bare` pages (log in, sign up, 404) get a reduced header.
export function SiteLayout({ variant = 'full' }) {
  return (
    <div className="site">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="container site-header">
        <Brand />
        {variant === 'full' && (
          <nav className="nav" aria-label="Main">
            <NavLink to="/ranking" className="nav__link" onMouseEnter={prefetchRanking} onFocus={prefetchRanking}>
              Leaderboard
            </NavLink>
            <AccountNav />
          </nav>
        )}
        {variant === 'back' && (
          <Link to="/" className="nav__link">
            Back to scenes
          </Link>
        )}
      </div>
      <Stripes />
      <main id="main" className="site__main">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
