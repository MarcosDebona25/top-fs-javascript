import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { useAuth } from '@blog/shared/auth';
import { Notes } from './Notes.jsx';
import { stubApi } from '../../../test/fetch.js';

vi.mock('@blog/shared/auth', () => ({ useAuth: vi.fn() }));

const reader1 = { id: 6, username: 'reader1' };
const reader2 = { id: 7, username: 'reader2' };
const note = (id, author, content) => ({ id, content, author, createdAt: '2026-10-16T12:00:00Z', editedAt: null });

function renderNotes() {
  const onCountChange = vi.fn();
  render(
    <MemoryRouter>
      <Notes postId={3} onCountChange={onCountChange} />
    </MemoryRouter>
  );
  return { onCountChange };
}

describe('Notes', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ status: 'authenticated', user: reader1 });
  });

  it('shows notes as plain text, even when they contain HTML', async () => {
    stubApi({ 'GET /posts/3/comments': [200, { comments: [note(1, reader2, '<b>bold</b> <script>x</script>')] }] });
    renderNotes();
    expect(await screen.findByText('<b>bold</b> <script>x</script>')).toBeInTheDocument();
    expect(document.querySelector('.notes b')).toBeNull();
  });

  it('offers Edit and Delete only on your own notes', async () => {
    stubApi({
      'GET /posts/3/comments': [200, { comments: [note(1, reader2, 'Theirs'), note(2, reader1, 'Mine')] }],
    });
    renderNotes();
    const [theirs, mine] = await screen.findAllByRole('listitem');
    expect(within(theirs).queryByRole('button', { name: 'Edit' })).toBeNull();
    expect(within(mine).getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(within(mine).getByText(/yours/)).toBeInTheDocument();
  });

  it('invites anonymous readers to log in instead of showing the form', async () => {
    useAuth.mockReturnValue({ status: 'anonymous', user: null });
    stubApi({ 'GET /posts/3/comments': [200, { comments: [] }] });
    renderNotes();
    expect(await screen.findByText(/Be the first to write in the margin/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
    expect(screen.queryByLabelText('Leave a note')).toBeNull();
  });

  it('posts a note, adds it to the list and reports the new count', async () => {
    const user = userEvent.setup();
    const fetch = stubApi({
      'GET /posts/3/comments': [200, { comments: [] }],
      'POST /posts/3/comments': (init) => [201, { comment: note(9, reader1, JSON.parse(init.body).content) }],
    });
    const { onCountChange } = renderNotes();

    await user.type(await screen.findByLabelText('Leave a note'), '  Thanks for this.  ');
    await user.click(screen.getByRole('button', { name: 'Post note' }));

    expect(await screen.findByText('Thanks for this.')).toBeInTheDocument();
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ content: 'Thanks for this.' });
    expect(onCountChange).toHaveBeenLastCalledWith(1);
    expect(screen.getByLabelText('Leave a note')).toHaveValue('');
  });

  it('does not send an empty note', async () => {
    const user = userEvent.setup();
    const fetch = stubApi({ 'GET /posts/3/comments': [200, { comments: [] }] });
    renderNotes();
    await user.click(await screen.findByRole('button', { name: 'Post note' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Write something first.');
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('edits and deletes your own note after confirming', async () => {
    const user = userEvent.setup();
    stubApi({
      'GET /posts/3/comments': [200, { comments: [note(2, reader1, 'Mine')] }],
      'PATCH /comments/2': [200, { comment: { ...note(2, reader1, 'Mine, revised'), editedAt: '2026-10-17T00:00:00Z' } }],
      'DELETE /comments/2': [204],
    });
    const { onCountChange } = renderNotes();

    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    const box = screen.getByLabelText('Edit your note');
    await user.clear(box);
    await user.type(box, 'Mine, revised');
    await user.click(screen.getByRole('button', { name: 'Save note' }));
    expect(await screen.findByText('Mine, revised')).toBeInTheDocument();
    expect(screen.getByText(/edited/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: 'Delete note' }));
    expect(await screen.findByText(/Be the first|No notes yet/)).toBeInTheDocument();
    expect(onCountChange).toHaveBeenLastCalledWith(0);
  });

  it('explains a lost session when saving fails with 401', async () => {
    const user = userEvent.setup();
    stubApi({
      'GET /posts/3/comments': [200, { comments: [] }],
      'POST /posts/3/comments': [401, { error: 'Unauthorized' }],
    });
    renderNotes();
    await user.type(await screen.findByLabelText('Leave a note'), 'Hello');
    await user.click(screen.getByRole('button', { name: 'Post note' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Your session ended.');
  });
});
