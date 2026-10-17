const prisma = require('../lib/prisma');
const { HttpError, parseId } = require('../lib/http');
const { validated } = require('../lib/validation');
const { POST_SELECT, COMMENT_SELECT, toPost } = require('../lib/representations');

// A draft exists only for its author: for everyone else it is a 404, never a 403.
function isVisible(post, user) {
  return post.publishedAt !== null || (user && user.id === post.authorId);
}

async function findVisiblePost(postId, user, select = POST_SELECT) {
  const post = await prisma.post.findUnique({ where: { id: postId }, select });
  if (!post || !isVisible(post, user)) throw new HttpError(404, 'Post not found');
  return post;
}

async function listPublished(req, res) {
  const rows = await prisma.post.findMany({
    where: { publishedAt: { not: null } },
    orderBy: { publishedAt: 'desc' },
    select: POST_SELECT,
  });
  res.json({ posts: rows.map((row) => toPost(row, { withContent: false })) });
}

async function getPost(req, res) {
  const post = await findVisiblePost(parseId(req.params.postId), req.user);
  res.json({ post: toPost(post) });
}

// New posts always start as drafts; publishing is a separate PATCH.
async function createPost(req, res) {
  const { title, content } = validated(req);
  const row = await prisma.post.create({
    data: { title, content, authorId: req.user.id },
    select: POST_SELECT,
  });
  res.status(201).location(`/api/posts/${row.id}`).json({ post: toPost(row) });
}

async function updatePost(req, res) {
  const postId = parseId(req.params.postId);
  const { title, content, published } = validated(req);

  // Only finds the post if it belongs to the requester: someone else's post and a missing one are the same 404.
  const current = await prisma.post.findFirst({
    where: { id: postId, authorId: req.user.id },
    select: { publishedAt: true },
  });
  if (!current) throw new HttpError(404, 'Post not found');

  const data = {};
  if (title !== undefined) data.title = title;
  if (content !== undefined) data.content = content;
  // `published` is the representation; the server owns the date. Re-sending true keeps the original date.
  if (published === true && current.publishedAt === null) data.publishedAt = new Date();
  if (published === false) data.publishedAt = null;

  const row = await prisma.post.update({ where: { id: postId }, data, select: POST_SELECT });
  res.json({ post: toPost(row) });
}

async function deletePost(req, res) {
  const { count } = await prisma.post.deleteMany({
    where: { id: parseId(req.params.postId), authorId: req.user.id },
  });
  if (count === 0) throw new HttpError(404, 'Post not found');
  res.status(204).end();
}

async function listComments(req, res) {
  const post = await findVisiblePost(parseId(req.params.postId), req.user, {
    id: true,
    authorId: true,
    publishedAt: true,
  });
  const comments = await prisma.comment.findMany({
    where: { postId: post.id },
    orderBy: { createdAt: 'asc' },
    select: COMMENT_SELECT,
  });
  res.json({ comments });
}

// Comments are only accepted on published posts, even from the post's own author.
async function createComment(req, res) {
  const postId = parseId(req.params.postId);
  const { content } = validated(req);
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { publishedAt: true } });
  if (!post || post.publishedAt === null) throw new HttpError(404, 'Post not found');

  const comment = await prisma.comment.create({
    data: { content, postId, authorId: req.user.id },
    select: COMMENT_SELECT,
  });
  res.status(201).location(`/api/comments/${comment.id}`).json({ comment });
}

module.exports = { listPublished, getPost, createPost, updatePost, deletePost, listComments, createComment };
