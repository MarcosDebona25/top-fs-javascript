require('dotenv/config');
const bcrypt = require('bcryptjs');
const prisma = require('../src/lib/prisma');

const BCRYPT_COST = 12;
const DAY = 24 * 60 * 60 * 1000;
const AUTHOR_COUNT = 5;
const POSTS_PER_AUTHOR = 4;
const READERS = ['reader1', 'reader2', 'reader3'];

const TOPICS = [
  'Why I stopped writing clever code',
  'Notes on keeping a database small',
  'What a JWT is not',
  'The case for boring technology',
  'Reading other people\'s pull requests',
  'A week without a framework',
  'Naming things, again',
  'How I debug at 2 a.m.',
  'Small functions, honest names',
  'Why every project needs a README',
  'Learning SQL by breaking it',
  'On writing tests nobody asked for',
  'The unreasonable effectiveness of a checklist',
  'Deleting code is a feature',
  'CORS, explained with a bouncer',
  'Pagination without tears',
  'What I learned from a failed migration',
  'Keeping secrets out of git',
  'Rate limits are a kindness',
  'Markdown as a writing format',
];

const COMMENTS = [
  'This matches my experience exactly.',
  'Thanks for writing this down.',
  'I disagree with the second point, but I enjoyed reading it.',
  'Bookmarked for the next time I get stuck on this.',
  'Could you share an example of this in practice?',
];

// One essay written in full, so the reader site has a real page to show.
const FULL_ESSAYS = {
  'Why I stopped writing clever code': `Clever code is a loan you take from your future self. It reads well on the day you write it, when the whole problem fits in your head. Three months later, the interest is due.

## The interest

Every trick needs a comment, and comments rot. The next person to read the code, often me, has to rebuild the reasoning before changing a single line.

> Everyone knows that debugging is twice as hard as writing a program in the first place. (Brian Kernighan)

## What I do instead

- Prefer names over comments.
- Prefer a loop over a one-liner that needs a diagram.
- Leave the clever version in the commit message, not in the code.

\`\`\`js
let total = 0;
for (const item of items) {
  total += item.price * item.qty;
}
\`\`\`

Boring code is not a lack of skill. It is a choice to be kind to whoever comes next.`,
};

const OPENINGS = [
  'I put off writing this for a month, which is usually a sign it matters.',
  'This started as a note to myself after a long week.',
  'Most of what I know about this I learned by getting it wrong first.',
  'A colleague asked me about this last week, and my answer was too long for chat.',
];

// Every other essay follows one template, varied enough that excerpts and pages differ.
function postContent(title, index) {
  if (FULL_ESSAYS[title]) return FULL_ESSAYS[title];
  return `${OPENINGS[index % OPENINGS.length]} The subject is ${title.toLowerCase()}, and the short answer is to start small.

## The short version

Start small, measure, and change one thing at a time. When something works, write down why before you forget.

- Write it down
- Try the simplest option first
- Revisit it in a month

## What I would tell myself a year ago

Most problems here are not hard, they are just easy to rush. Slow down for ten minutes and the next ten hours go better.`;
}

async function main() {
  const { AUTHOR_PASSWORD, READER_PASSWORD } = process.env;
  if (!AUTHOR_PASSWORD || !READER_PASSWORD) {
    throw new Error('AUTHOR_PASSWORD and READER_PASSWORD must be set in .env');
  }

  const authorHash = await bcrypt.hash(AUTHOR_PASSWORD, BCRYPT_COST);
  const readerHash = await bcrypt.hash(READER_PASSWORD, BCRYPT_COST);

  // upsert by username: running the seed again updates the same accounts instead of failing on the unique username.
  const authors = [];
  for (let i = 1; i <= AUTHOR_COUNT; i += 1) {
    const username = `author${i}`;
    authors.push(
      await prisma.user.upsert({
        where: { username },
        update: { passwordHash: authorHash, role: 'AUTHOR' },
        create: { username, passwordHash: authorHash, role: 'AUTHOR' },
      })
    );
  }
  const readers = [];
  for (const username of READERS) {
    readers.push(
      await prisma.user.upsert({
        where: { username },
        update: {},
        create: { username, passwordHash: readerHash },
      })
    );
  }

  // Post has no unique field, so upsert cannot be used: wipe and recreate so a second run does not duplicate.
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();

  const now = Date.now();
  const posts = [];
  for (let i = 0; i < AUTHOR_COUNT * POSTS_PER_AUTHOR; i += 1) {
    const title = TOPICS[i % TOPICS.length];
    const isDraft = i % 5 === 4; // every fifth post is an unpublished draft
    posts.push(
      await prisma.post.create({
        data: {
          title,
          content: postContent(title, i),
          publishedAt: isDraft ? null : new Date(now - (i + 1) * DAY),
          authorId: authors[i % AUTHOR_COUNT].id,
        },
      })
    );
  }

  // Comments only on published posts (the API rejects them on drafts).
  const comments = [];
  posts
    .filter((post) => post.publishedAt)
    .forEach((post, index) => {
      const count = index % 3; // 0, 1 or 2 comments per post
      for (let c = 0; c < count; c += 1) {
        comments.push({
          content: COMMENTS[(index + c) % COMMENTS.length],
          postId: post.id,
          authorId: readers[(index + c) % readers.length].id,
          createdAt: new Date(now - (index + c) * 60 * 60 * 1000),
        });
      }
    });
  await prisma.comment.createMany({ data: comments });

  console.log(
    `Seeded ${authors.length} authors, ${readers.length} readers, ${posts.length} posts (${posts.filter((p) => !p.publishedAt).length} drafts), ${comments.length} comments.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
