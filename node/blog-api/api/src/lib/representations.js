// What the API returns: built from explicit selects, never from whole rows.

const AUTHOR_SELECT = { select: { id: true, username: true } };

const POST_SELECT = {
  id: true,
  title: true,
  content: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  authorId: true,
  author: AUTHOR_SELECT,
  _count: { select: { comments: true } },
};

const COMMENT_SELECT = {
  id: true,
  content: true,
  createdAt: true,
  editedAt: true,
  postId: true,
  author: AUTHOR_SELECT,
};

const EXCERPT_LENGTH = 220;

// Plain-text preview for lists: drops the most common Markdown marks.
function excerpt(markdown) {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > EXCERPT_LENGTH ? `${text.slice(0, EXCERPT_LENGTH).trimEnd()}…` : text;
}

function toPost(row, { withContent = true } = {}) {
  const post = {
    id: row.id,
    title: row.title,
    published: row.publishedAt !== null,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    author: row.author,
    commentCount: row._count.comments,
  };
  if (withContent) post.content = row.content;
  else post.excerpt = excerpt(row.content);
  return post;
}

module.exports = { POST_SELECT, COMMENT_SELECT, toPost };
