import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { apiFetch } from '@blog/shared/api';
import { useAuth } from '@blog/shared/auth';
import { timeAgo } from '@blog/shared/format';
import { Loading, LoadError, NotFound } from '@blog/shared/states';
import { useDocumentTitle } from '@blog/shared/useDocumentTitle';
import { EssayPreview } from '../components/EssayPreview.jsx';
import { clearDraft, loadDraft, saveDraft } from '../drafts.js';
import { CONTENT_MAX, TITLE_MAX, saveStatus, validateEssay } from '../essay.js';
import { readerUrl } from '../siteUrl.js';

export function EditorPage() {
  const { essayId } = useParams();
  const navigate = useNavigate();
  const { status: authStatus, user } = useAuth();

  const [post, setPost] = useState(null); // the last version the API confirmed
  const [load, setLoad] = useState({ status: essayId ? 'loading' : 'ready', error: null, attempt: 0 });
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [restored, setRestored] = useState(false);
  const [mode, setMode] = useState('write'); // write | preview
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  // A save that hit a 401; it runs again once the session dialog logs back in.
  const pending = useRef(null);
  useDocumentTitle(title.trim() || 'New essay', 'The desk');

  // Load the saved essay, then prefer this device's unsaved copy if there is one.
  useEffect(() => {
    if (!essayId) {
      const draft = loadDraft(null);
      if (draft) {
        setTitle(draft.title);
        setContent(draft.content);
        setRestored(true);
      }
      return undefined;
    }
    const controller = new AbortController();
    apiFetch(`/posts/${essayId}`, { signal: controller.signal })
      .then(({ post: saved }) => {
        setPost(saved);
        const draft = loadDraft(saved.id);
        const differs = draft && (draft.title !== saved.title || draft.content !== saved.content);
        setTitle(differs ? draft.title : saved.title);
        setContent(differs ? draft.content : saved.content);
        setRestored(Boolean(differs));
        setLoad((l) => ({ ...l, status: 'ready' }));
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setLoad((l) => ({ ...l, status: 'error', error: err }));
      });
    return () => controller.abort();
  }, [essayId, load.attempt]);

  const dirty = post ? title !== post.title || content !== post.content : title !== '' || content !== '';

  // Every keystroke is kept on this device until the API confirms a save.
  useEffect(() => {
    if (load.status !== 'ready') return;
    const key = post?.id ?? null;
    if (dirty) saveDraft(key, { title, content });
    else clearDraft(key);
  }, [title, content, dirty, post, load.status]);

  useEffect(() => {
    if (authStatus === 'authenticated' && pending.current) {
      const retry = pending.current;
      pending.current = null;
      retry();
    }
  }, [authStatus]);

  if (load.status === 'loading') return <Loading label="Opening the essay…" />;
  if (load.status === 'error') {
    if (load.error.status === 404) return <NotFound title="This essay isn’t on your desk." text="It may have been deleted." />;
    return (
      <LoadError
        title="We couldn’t open this essay."
        error={load.error}
        onRetry={() => setLoad((l) => ({ status: 'loading', error: null, attempt: l.attempt + 1 }))}
      />
    );
  }
  // GET /posts/:id also returns other authors' published essays; the desk only edits your own.
  if (post && user && post.author.id !== user.id) {
    return <NotFound title="This essay isn’t on your desk." text="You can only edit essays you wrote." />;
  }

  async function save({ publish = false } = {}) {
    const problem = validateEssay({ title, content });
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      let saved = post;
      if (!saved) {
        ({ post: saved } = await apiFetch('/posts', { method: 'POST', body: { title, content } }));
        clearDraft(null);
        setPost(saved);
        if (publish) ({ post: saved } = await apiFetch(`/posts/${saved.id}`, { method: 'PATCH', body: { published: true } }));
      } else {
        const body = { title, content };
        if (publish) body.published = true;
        ({ post: saved } = await apiFetch(`/posts/${saved.id}`, { method: 'PATCH', body }));
      }
      clearDraft(saved.id);
      setPost(saved);
      setTitle(saved.title);
      setContent(saved.content);
      setRestored(false);
      if (publish) {
        setMode('write');
        setNotice('Published. Readers can see it now.');
      }
      if (!essayId) navigate(`/essays/${saved.id}/edit`, { replace: true });
    } catch (err) {
      if (err.status === 401) pending.current = () => save({ publish });
      else if (err.status === 422) setError(Object.values(err.details ?? {})[0] ?? err.message);
      else setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function discardRestored() {
    setTitle(post?.title ?? '');
    setContent(post?.content ?? '');
    setRestored(false);
  }

  if (mode === 'preview') {
    return (
      <EssayPreview
        title={title}
        content={content}
        author={user?.username}
        post={post}
        busy={busy}
        onBack={() => setMode('write')}
        onPublish={() => save({ publish: true })}
      />
    );
  }

  const published = post?.published ?? false;
  return (
    <div className="editor ui">
      <div className="editor-top">
        <Link to="/">← Your essays</Link>
        <div className="status">
          <p className="meta" role="status">
            {saveStatus({ post, dirty, timeAgo })}
          </p>
          <button type="button" className="btn quiet small" onClick={() => setMode('preview')}>
            Preview
          </button>
        </div>
      </div>

      {restored && (
        <div className="notice" role="status">
          <span>Restored your unsaved changes from this device.</span>
          <button type="button" className="btn-link muted" onClick={discardRestored}>
            {post ? 'Discard them' : 'Start over'}
          </button>
        </div>
      )}
      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>
          {post && <a href={readerUrl(`/posts/${post.id}`)}>View on the site</a>}
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <label htmlFor="essay-title" className="label">
          Title
        </label>
        <input
          id="essay-title"
          className="title-input"
          placeholder="A title for the essay"
          maxLength={TITLE_MAX}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="content-head">
          <label htmlFor="essay-content" className="label">
            Content · Markdown
          </label>
          <p className="hint">## heading, **bold**, `code`, &gt; quote, - list. HTML shows as plain text.</p>
        </div>
        <textarea
          id="essay-content"
          className="content-input"
          rows={22}
          maxLength={CONTENT_MAX}
          placeholder="Start writing. The first paragraph gets the drop cap."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="editor-foot">
          <p className="hint">
            {content.length.toLocaleString('en-US')} of {CONTENT_MAX.toLocaleString('en-US')} characters
          </p>
          <div className="buttons">
            {published ? (
              <button type="submit" className="btn" disabled={busy}>
                {busy ? 'Saving…' : 'Save changes'}
              </button>
            ) : (
              <>
                <button type="submit" className="btn quiet" disabled={busy}>
                  {busy ? 'Saving…' : 'Save draft'}
                </button>
                <button type="button" className="btn" disabled={busy} onClick={() => save({ publish: true })}>
                  Publish
                </button>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
