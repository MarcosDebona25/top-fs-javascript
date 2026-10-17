const prisma = require('../lib/prisma');
const { HttpError, parseId } = require('../lib/http');
const { validated } = require('../lib/validation');
const { COMMENT_SELECT } = require('../lib/representations');

// Nobody manages someone else's comments, not even the post's author.
// A comment on a visible post is public, so someone else's comment is a 403;
// one on a draft is hidden like the draft itself, so it is a 404.
async function findOwnComment(commentId, user) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true, post: { select: { authorId: true, publishedAt: true } } },
  });
  const visible = comment && (comment.post.publishedAt !== null || comment.post.authorId === user.id);
  if (!visible) throw new HttpError(404, 'Comment not found');
  if (comment.authorId !== user.id) throw new HttpError(403, 'You can only change your own comments');
}

async function updateComment(req, res) {
  const commentId = parseId(req.params.commentId);
  const { content } = validated(req);
  await findOwnComment(commentId, req.user);
  const comment = await prisma.comment.update({
    where: { id: commentId },
    data: { content, editedAt: new Date() },
    select: COMMENT_SELECT,
  });
  res.json({ comment });
}

async function deleteComment(req, res) {
  const commentId = parseId(req.params.commentId);
  await findOwnComment(commentId, req.user);
  await prisma.comment.delete({ where: { id: commentId } });
  res.status(204).end();
}

module.exports = { updateComment, deleteComment };
