import { Link } from 'react-router';

export function Loading({ label }) {
  return (
    <div className="state ui" role="status">
      <p className="meta">{label}</p>
      <p className="fleuron faint" aria-hidden="true">
        {'\u2766\uFE0E'}
      </p>
    </div>
  );
}

export function LoadError({ title, error, onRetry }) {
  return (
    <div className="state ui" role="alert">
      <h1 className="display">{title}</h1>
      <p>{error.status === 0 ? error.message : 'Something went wrong on the server. Try again in a moment.'}</p>
      <div className="actions">
        <button type="button" className="btn quiet" onClick={onRetry}>
          Try again
        </button>
      </div>
    </div>
  );
}

export function NotFound({ title, text }) {
  return (
    <div className="state ui">
      <p className="big-number" aria-hidden="true">
        404
      </p>
      <h1 className="display">{title}</h1>
      <p>{text}</p>
      <p>
        <Link to="/">Back to the index</Link>
      </p>
    </div>
  );
}
