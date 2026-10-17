import { useState } from 'react';
import { Link } from 'react-router';
import { apiFetch } from '@blog/shared/api';
import { useFetch } from '@blog/shared/useFetch';
import { formatDate, notesLabel, plural, timeAgo } from '@blog/shared/format';
import { Loading, LoadError } from '@blog/shared/states';
import { useDocumentTitle } from '@blog/shared/useDocumentTitle';
import { readerUrl } from '../siteUrl.js';

const FILTERS = [
  { id: 'all', label: 'All', keep: () => true },
  { id: 'published', label: 'Published', keep: (post) => post.published },
  { id: 'drafts', label: 'Drafts', keep: (post) => !post.published },
];

export function DeskPage() {
  const { status, data, error, retry } = useFetch('/me/posts');
  // null until the author changes something; until then the list is what the API sent.
  const [edited, setEdited] = useState(null);
  const [filter, setFilter] = useState('all');
  useDocumentTitle('Your essays', 'The desk');

  if (status === 'loading') return <Loading label="Fetching your essays…" />;
  if (status === 'error') return <LoadError title="We couldn’t load your essays." error={error} onRetry={retry} />;

  const posts = edited ?? data.posts;
  const replace = (post) => setEdited(posts.map((p) => (p.id === post.id ? post : p)));
  const remove = (id) => setEdited(posts.filter((p) => p.id !== id));
  const shown = posts.filter(FILTERS.find((f) => f.id === filter).keep);

  return (
    <div className="desk ui">
      <div className="desk-head">
        <div>
          <p className="kicker">On the desk</p>
          <h1 className="display">Your essays</h1>
        </div>
        <Link to="/essays/new" className="btn">
          New essay
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="state">
          <p className="fleuron" aria-hidden="true">
            {'❦︎'}
          </p>
          <h2 className="display">The desk is clear.</h2>
          <p>Every essay starts as a private draft. Nobody sees it until you publish.</p>
          <div className="actions">
            <Link to="/essays/new" className="btn">
              Write your first essay
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div role="group" aria-label="Show" className="filters">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className="tab"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.label} {posts.filter(f.keep).length}
              </button>
            ))}
          </div>
          {shown.length === 0 ? (
            <p className="meta empty-filter">
              {filter === 'drafts' ? 'No drafts. Everything here is published.' : 'Nothing published yet.'}
            </p>
          ) : (
            <ol className="desk-list">
              {shown.map((post) => (
                <DeskRow key={post.id} post={post} onChange={replace} onRemove={remove} />
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}

function DeskRow({ post, onChange, onRemove }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function togglePublished() {
    setBusy(true);
    setError(null);
    try {
      const { post: updated } = await apiFetch(`/posts/${post.id}`, {
        method: 'PATCH',
        body: { published: !post.published },
      });
      onChange(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function destroy() {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/posts/${post.id}`, { method: 'DELETE' });
      onRemove(post.id);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const titleId = `essay-${post.id}`;
  return (
    <li className="desk-row" aria-labelledby={titleId}>
      <div className="body">
        <p className="label">
          {post.published ? (
            <>
              <span className="status-published">Published</span> · {formatDate(post.publishedAt, 'short')}
            </>
          ) : (
            <span className="status-draft">Draft</span>
          )}
        </p>
        <h2 id={titleId}>
          <Link className="plain" to={`/essays/${post.id}/edit`}>
            {post.title}
          </Link>
        </h2>
        <p className="meta">
          Edited {timeAgo(post.updatedAt)}
          {post.published && (
            <>
              {' · '}
              <a href={readerUrl(`/posts/${post.id}#notes`)}>{notesLabel(post.commentCount)}</a>
            </>
          )}
        </p>
      </div>

      {!confirming && (
        <div className="row-actions">
          <Link className="btn-link" to={`/essays/${post.id}/edit`}>
            Edit
          </Link>
          <button type="button" className="btn-link" onClick={togglePublished} disabled={busy}>
            {post.published ? 'Unpublish' : 'Publish'}
          </button>
          <button type="button" className="btn-link muted" onClick={() => setConfirming(true)}>
            Delete
          </button>
        </div>
      )}

      {confirming && (
        <div className="confirm" role="group" aria-label={`Delete ${post.title}`}>
          <p>
            Delete this essay for good?{' '}
            {post.commentCount === 1 && 'Its one note goes with it. '}
            {post.commentCount > 1 && `Its ${plural(post.commentCount, 'note')} go with it. `}
            This can’t be undone.
          </p>
          <button type="button" className="btn danger" onClick={destroy} disabled={busy}>
            Delete essay
          </button>
          <button type="button" className="btn quiet" onClick={() => setConfirming(false)}>
            Keep it
          </button>
        </div>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}
