import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { apiFetch } from '@blog/shared/api';
import { useAuth } from '@blog/shared/auth';
import { useFetch } from '@blog/shared/useFetch';
import { formatDate, readersLabel } from '@blog/shared/format';
import { returnTo } from '@blog/shared/returnTo';

const MAX_LENGTH = 1000;

// Turns an API error into one sentence for the person writing the note.
function noteError(error) {
  if (error.status === 401) return 'Your session ended. Log in again to keep writing.';
  if (error.status === 0) return error.message;
  return error.details?.content ?? error.message;
}

export function Notes({ postId, onCountChange }) {
  const { status: authStatus, user } = useAuth();
  const location = useLocation();
  const { status, data, retry } = useFetch(`/posts/${postId}/comments`);
  // null until the reader changes something; until then the list is what the API sent.
  const [edited, setEdited] = useState(null);
  const notes = edited ?? data?.comments ?? [];

  // Keeps the essay header's count in step with the list without re-running on every render.
  const reportCount = useRef(onCountChange);
  reportCount.current = onCountChange;
  useEffect(() => {
    if (status === 'success') reportCount.current(notes.length);
  }, [status, notes.length]);

  const add = (note) => setEdited([...notes, note]);
  const replace = (note) => setEdited(notes.map((n) => (n.id === note.id ? note : n)));
  const remove = (id) => setEdited(notes.filter((n) => n.id !== id));

  return (
    <section id="notes" className="notes" aria-labelledby="notes-title">
      <div className="notes-head">
        <h2 id="notes-title">Notes in the margin</h2>
        {status === 'success' && <p className="meta">{readersLabel(notes)}</p>}
      </div>

      {status === 'loading' && (
        <div className="state ui" role="status">
          <p className="meta">Loading notes…</p>
        </div>
      )}

      {status === 'error' && (
        <div className="state ui" role="alert">
          <p>We couldn’t load the notes.</p>
          <div className="actions">
            <button type="button" className="btn quiet" onClick={retry}>
              Try again
            </button>
          </div>
        </div>
      )}

      {status === 'success' && (
        <>
          <ol className="notes-list">
            {notes.map((note, i) => (
              <NoteItem
                key={note.id}
                number={i + 1}
                note={note}
                isOwn={user?.id === note.author.id}
                onSaved={replace}
                onDeleted={remove}
              />
            ))}
          </ol>

          {authStatus === 'authenticated' && (
            <NoteForm number={notes.length + 1} postId={postId} username={user.username} onCreated={add} />
          )}
          {authStatus === 'anonymous' && (
            <div className="row notes-invite">
              <span className="num faint" aria-hidden="true">
                {notes.length + 1}
              </span>
              <p className="body">
                {notes.length === 0 ? 'Be the first to write in the margin. ' : ''}
                <Link to="/login" state={returnTo(location)}>
                  Log in
                </Link>{' '}
                or{' '}
                <Link to="/signup" state={returnTo(location)}>
                  create an account
                </Link>{' '}
                to leave a note.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function NoteItem({ number, note, isOwn, onSaved, onDeleted }) {
  const [mode, setMode] = useState('view'); // view | edit | confirm
  const [draft, setDraft] = useState(note.content);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  function cancel() {
    setMode('view');
    setDraft(note.content);
    setError(null);
  }

  async function save(event) {
    event.preventDefault();
    const content = draft.trim();
    if (!content) {
      setError('A note can’t be empty.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { comment } = await apiFetch(`/comments/${note.id}`, { method: 'PATCH', body: { content } });
      onSaved(comment);
      setMode('view');
    } catch (err) {
      setError(noteError(err));
    } finally {
      setBusy(false);
    }
  }

  async function destroy() {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/comments/${note.id}`, { method: 'DELETE' });
      onDeleted(note.id);
    } catch (err) {
      setError(noteError(err));
      setBusy(false);
    }
  }

  const editId = `note-edit-${note.id}`;
  return (
    <li className="row">
      <span className="num" aria-hidden="true">
        {number}
      </span>
      <div className="body">
        {mode === 'edit' ? (
          <form className="stack ui" onSubmit={save}>
            <label className="sr-only" htmlFor={editId}>
              Edit your note
            </label>
            <textarea
              id={editId}
              className="input note-edit"
              rows={3}
              maxLength={MAX_LENGTH}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <div className="note-actions">
              <button type="submit" className="btn" disabled={busy}>
                {busy ? 'Saving…' : 'Save note'}
              </button>
              <button type="button" className="btn-link muted" onClick={cancel}>
                Cancel
              </button>
              <span className="hint">Edited notes are marked as edited.</span>
            </div>
          </form>
        ) : (
          <>
            <p className="note-text">{note.content}</p>
            <div className="note-actions">
              <p className="note-sign">
                — <span className="sc">{note.author.username}</span>{' '}
                <span className="meta">
                  · {formatDate(note.createdAt, 'short')}
                  {note.editedAt && ' · edited'}
                  {isOwn && ' · yours'}
                </span>
              </p>
              {isOwn && mode === 'view' && (
                <>
                  <button type="button" className="btn-link" onClick={() => setMode('edit')}>
                    Edit
                  </button>
                  <button type="button" className="btn-link muted" onClick={() => setMode('confirm')}>
                    Delete
                  </button>
                </>
              )}
            </div>
            {mode === 'confirm' && (
              <div className="note-actions ui" role="group" aria-label="Confirm delete">
                <span>Delete this note? This can’t be undone.</span>
                <button type="button" className="btn danger" onClick={destroy} disabled={busy}>
                  Delete note
                </button>
                <button type="button" className="btn quiet" onClick={() => setMode('view')}>
                  Keep it
                </button>
              </div>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </li>
  );
}

function NoteForm({ number, postId, username, onCreated }) {
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit(event) {
    event.preventDefault();
    const text = content.trim();
    if (!text) {
      setError('Write something first.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { comment } = await apiFetch(`/posts/${postId}/comments`, { method: 'POST', body: { content: text } });
      onCreated(comment);
      setContent('');
    } catch (err) {
      setError(noteError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="row note-form" onSubmit={submit}>
      <span className="num faint" aria-hidden="true">
        {number}
      </span>
      <div className="body stack ui">
        <label className="title" htmlFor="note-new">
          Leave a note
        </label>
        <textarea
          id="note-new"
          className="input"
          rows={4}
          maxLength={MAX_LENGTH}
          placeholder="Plain text, up to 1000 characters."
          aria-describedby="note-help"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="split">
          <span id="note-help" className="hint">
            Signed as {username} · {content.length} / {MAX_LENGTH}
          </span>
          <button type="submit" className="btn" disabled={busy}>
            {busy ? 'Posting…' : 'Post note'}
          </button>
        </div>
      </div>
    </form>
  );
}
