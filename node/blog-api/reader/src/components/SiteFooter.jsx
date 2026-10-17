import { Link, useLocation } from 'react-router';
import { useAuth } from '@blog/shared/auth';
import { returnTo } from '@blog/shared/returnTo';

export function SiteFooter() {
  const { status, user, logOut } = useAuth();
  const location = useLocation();

  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="sf-top">
          <div className="sf-brand">
            <Link to="/" className="sf-mark">
              Marginalia
            </Link>
            <p>Notes on writing software. Essays by five authors, and the notes their readers leave in the margin.</p>
          </div>
          <nav className="sf-col" aria-label="Read">
            <p className="label">Read</p>
            <Link to="/">The index</Link>
            <button type="button" className="btn-link" onClick={() => window.scrollTo(0, 0)}>
              Back to top
            </button>
          </nav>
          <nav className="sf-col" aria-label="Account">
            <p className="label">Account</p>
            {status === 'authenticated' && (
              <>
                <span>Signed in as {user.username}</span>
                <button type="button" className="btn-link" onClick={logOut}>
                  Log out
                </button>
              </>
            )}
            {status === 'anonymous' && (
              <>
                <Link to="/login" state={returnTo(location)}>
                  Log in
                </Link>
                <Link to="/signup" state={returnTo(location)}>
                  Create an account
                </Link>
              </>
            )}
          </nav>
        </div>
        <div className="sf-bottom">
          <span>© 2026 Marginalia</span>
          <span>Set in Fraunces, Source Serif 4 and Source Sans 3</span>
          <span>Built with Express, Prisma and React</span>
        </div>
      </div>
    </footer>
  );
}
