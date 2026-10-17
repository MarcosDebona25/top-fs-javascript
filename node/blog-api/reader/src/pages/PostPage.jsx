import { useState } from 'react';
import { useParams } from 'react-router';
import { useFetch } from '@blog/shared/useFetch';
import { Markdown } from '@blog/shared/markdown';
import { formatDate, plural, readingMinutes } from '@blog/shared/format';
import { Loading, LoadError, NotFound } from '@blog/shared/states';
import { Notes } from '../components/Notes.jsx';
import { useDocumentTitle } from '@blog/shared/useDocumentTitle';

export function PostPage() {
  const { postId } = useParams();
  const { status, data, error, retry } = useFetch(`/posts/${postId}`);
  const post = data?.post;
  // The notes section reports its own count once loaded, so the header stays in step after adding one.
  const [noteCount, setNoteCount] = useState({ postId: null, count: 0 });
  useDocumentTitle(post?.title);

  if (status === 'loading') return <Loading label="Opening the essay…" />;
  if (status === 'error') {
    if (error.status === 404) {
      return <NotFound title="This essay isn’t here." text="It doesn’t exist, or it hasn’t been published yet." />;
    }
    return <LoadError title="We couldn’t load this essay." error={error} onRetry={retry} />;
  }

  const count = noteCount.postId === post.id ? noteCount.count : post.commentCount;
  return (
    <>
      <article>
        <header className="hero">
          <p className="kicker">{post.published ? `Essay · ${formatDate(post.publishedAt)}` : 'Draft · not published'}</p>
          <h1 className="display">{post.title}</h1>
          <dl className="facts">
            <div>
              <dt className="label">Written by</dt>
              <dd>{post.author.username}</dd>
            </div>
            <div>
              <dt className="label">Reading time</dt>
              <dd>{plural(readingMinutes(post.content), 'minute')}</dd>
            </div>
            {post.published && (
              <div>
                <dt className="label">Notes</dt>
                <dd>
                  <a href="#notes">{count === 0 ? 'None yet' : `${count} in the margin`}</a>
                </dd>
              </div>
            )}
          </dl>
        </header>
        <div className="article">
          <Markdown>{post.content}</Markdown>
        </div>
      </article>

      <p className="fleuron gap" aria-hidden="true">
        {'\u2766\uFE0E'}
      </p>
      {post.published && (
        <Notes key={post.id} postId={post.id} onCountChange={(n) => setNoteCount({ postId: post.id, count: n })} />
      )}
    </>
  );
}
