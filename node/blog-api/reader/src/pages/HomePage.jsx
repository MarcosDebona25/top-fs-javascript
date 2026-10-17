import { Link } from 'react-router';
import { useFetch } from '@blog/shared/useFetch';
import { formatDate, notesLabel, plural } from '@blog/shared/format';
import { Loading, LoadError } from '@blog/shared/states';
import { useDocumentTitle } from '@blog/shared/useDocumentTitle';

export function HomePage() {
  const { status, data, error, retry } = useFetch('/posts');
  useDocumentTitle(null);

  if (status === 'loading') return <Loading label="Fetching the latest essays…" />;
  if (status === 'error') return <LoadError title="We couldn’t load the essays." error={error} onRetry={retry} />;

  const { posts } = data;
  if (posts.length === 0) {
    return (
      <div className="state">
        <p className="fleuron" aria-hidden="true">
          {'\u2766\uFE0E'}
        </p>
        <h1 className="display">Nothing published yet.</h1>
        <p>The first essay is still on the desk. Come back soon.</p>
      </div>
    );
  }

  const [latest, ...older] = posts;
  return (
    <>
      <section className="featured" aria-labelledby="latest-title">
        <p className="kicker">Latest essay · {formatDate(latest.publishedAt)}</p>
        <h1 id="latest-title" className="display">
          <Link className="plain" to={`/posts/${latest.id}`}>
            {latest.title}
          </Link>
        </h1>
        <p className="excerpt">{latest.excerpt}</p>
        <p className="meta">
          by {latest.author.username} · {notesLabel(latest.commentCount)}
        </p>
      </section>

      {older.length > 0 && (
        <>
          <p className="fleuron gap" aria-hidden="true">
            {'\u2766\uFE0E'}
          </p>
          <section className="index" aria-labelledby="index-title">
            <div className="section-head">
              <h2 id="index-title">The index</h2>
              <span className="label">{plural(posts.length, 'essay')} · newest first</span>
            </div>
            <ol className="index-list">
              {older.map((post, i) => (
                <li key={post.id} className="row index-item">
                  {/* Position in the list, oldest = 1; the latest essay above is number posts.length. */}
                  <span className="num" aria-hidden="true">
                    {posts.length - 1 - i}
                  </span>
                  <div className="body">
                    <p className="label">
                      {formatDate(post.publishedAt, 'short')} · {post.author.username}
                    </p>
                    <h3>
                      <Link className="plain" to={`/posts/${post.id}`}>
                        {post.title}
                      </Link>
                    </h3>
                    <p className="excerpt">{post.excerpt}</p>
                    <p className="meta">{notesLabel(post.commentCount)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </>
  );
}
