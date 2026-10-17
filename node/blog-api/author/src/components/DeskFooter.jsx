import { Link } from 'react-router';
import { readerUrl } from '../siteUrl.js';

export function DeskFooter({ user, onLogOut }) {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="sf-top">
          <div className="sf-brand">
            <Link to="/" className="sf-mark">
              Marginalia
            </Link>
            <p>The writers’ desk. Drafts stay private until you publish them; readers only see published essays.</p>
          </div>
          {user && (
            <nav className="sf-col" aria-label="The desk">
              <p className="label">The desk</p>
              <Link to="/">Your essays</Link>
              <Link to="/essays/new">New essay</Link>
            </nav>
          )}
          <nav className="sf-col" aria-label="Site">
            <p className="label">Site</p>
            <a href={readerUrl()}>View the site</a>
            {user && (
              <button type="button" className="btn-link" onClick={onLogOut}>
                Log out
              </button>
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
