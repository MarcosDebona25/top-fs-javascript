import { readerUrl } from '../siteUrl.js';

export function ReadersOnly({ user, onLogOut }) {
  return (
    <div className="state ui">
      <h1 className="display">The desk is for authors.</h1>
      <p>
        You’re logged in as <strong>{user.username}</strong>, a reader account. Readers can leave notes on the site.
      </p>
      <div className="actions buttons centered">
        <a className="btn" href={readerUrl()}>
          Go to the site
        </a>
        <button type="button" className="btn quiet" onClick={onLogOut}>
          Log out
        </button>
      </div>
    </div>
  );
}
