import { Markdown } from '@blog/shared/markdown';
import { formatDate, plural, readingMinutes } from '@blog/shared/format';

// The essay as the reader site will show it: same classes, same Markdown component.
export function EssayPreview({ title, content, author, post, onBack, onPublish, busy }) {
  const published = post?.published ?? false;
  return (
    <>
      <div className="preview-bar ui" role="region" aria-label="Preview">
        <p>
          <span className="kicker">Preview</span>{' '}
          <span className="meta">
            · This is how readers will see it.{published ? '' : ' Not published yet.'}
          </span>
        </p>
        <div className="buttons">
          <button type="button" className="btn-link" onClick={onBack}>
            ← Back to editing
          </button>
          {!published && (
            <button type="button" className="btn" onClick={onPublish} disabled={busy}>
              Publish
            </button>
          )}
        </div>
      </div>

      <article>
        <header className="hero">
          <p className="kicker">{published ? `Essay · ${formatDate(post.publishedAt)}` : 'Essay · Publishes today'}</p>
          <h1 className="display">{title.trim() || 'Untitled essay'}</h1>
          <dl className="facts">
            <div>
              <dt className="label">Written by</dt>
              <dd>{author}</dd>
            </div>
            <div>
              <dt className="label">Reading time</dt>
              <dd>{plural(readingMinutes(content), 'minute')}</dd>
            </div>
          </dl>
        </header>
        <div className="article">
          <Markdown>{content}</Markdown>
        </div>
      </article>

      <p className="fleuron gap" aria-hidden="true">
        {'❦︎'}
      </p>
      <section className="notes" aria-label="Notes">
        <div className="notes-head">
          <h2>Notes in the margin</h2>
          <p className="meta">
            {published ? 'Notes stay on the site; the preview doesn’t show them.' : 'Readers can leave notes once the essay is published.'}
          </p>
        </div>
      </section>
    </>
  );
}
