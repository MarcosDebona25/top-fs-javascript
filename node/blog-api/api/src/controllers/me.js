const prisma = require('../lib/prisma');
const { POST_SELECT, COMMENT_SELECT, toPost } = require('../lib/representations');

// Every query here filters by the session user: these routes have a single contract.
async function listMyPosts(req, res) {
  const rows = await prisma.post.findMany({
    where: { authorId: req.user.id },
    orderBy: { updatedAt: 'desc' },
    select: POST_SELECT,
  });
  res.json({ posts: rows.map((row) => toPost(row, { withContent: false })) });
}

async function listMyComments(req, res) {
  const comments = await prisma.comment.findMany({
    where: { authorId: req.user.id },
    orderBy: { createdAt: 'desc' },
    select: { ...COMMENT_SELECT, post: { select: { id: true, title: true } } },
  });
  res.json({ comments });
}

module.exports = { listMyPosts, listMyComments };
