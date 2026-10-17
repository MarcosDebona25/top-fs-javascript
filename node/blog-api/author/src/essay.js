// Same limits as the API validators (api/src/validators/post.js); the API still checks them.
export const TITLE_MAX = 150;
export const CONTENT_MAX = 50000;

export function validateEssay({ title, content }) {
  if (!title.trim()) return 'Give the essay a title.';
  if (title.trim().length > TITLE_MAX) return `Titles can be up to ${TITLE_MAX} characters.`;
  if (!content.trim()) return 'Write something before saving.';
  if (content.trim().length > CONTENT_MAX) return `Essays can be up to ${CONTENT_MAX.toLocaleString('en-US')} characters.`;
  return null;
}

// What the status line under the title says about the save state.
export function saveStatus({ post, dirty, timeAgo }) {
  if (!post) return dirty ? 'Not saved yet · kept on this device' : 'New essay';
  const state = post.published ? 'Published' : 'Draft';
  return dirty ? `${state} · Unsaved changes, kept on this device` : `${state} · Saved ${timeAgo(post.updatedAt)}`;
}
