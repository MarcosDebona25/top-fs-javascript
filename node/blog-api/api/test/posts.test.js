const { after, before, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { request, app, prisma, write, logIn, passwords } = require('./helpers');

let author1;
let author5;
let reader1;
let draft; // one of author5's seeded drafts

before(async () => {
  author1 = await logIn('author1', passwords.author);
  author5 = await logIn('author5', passwords.author);
  reader1 = await logIn('reader1', passwords.reader);
  draft = await prisma.post.findFirst({ where: { publishedAt: null, author: { username: 'author5' } } });
});

after(() => prisma.$disconnect());

describe('reading posts', () => {
  it('lists only published posts, newest first, with an excerpt instead of the content', async () => {
    const { body } = await request(app).get('/api/posts').expect(200);
    assert.ok(body.posts.length > 0);
    assert.ok(body.posts.every((post) => post.published));
    assert.ok(body.posts.every((post) => post.content === undefined && typeof post.excerpt === 'string'));
    const dates = body.posts.map((post) => Date.parse(post.publishedAt));
    assert.deepEqual(dates, [...dates].sort((a, b) => b - a));
    assert.ok(!body.posts.some((post) => post.excerpt.includes('##')), 'Markdown marks are stripped');
  });

  it('hides a draft from everyone but its author, with a 404', async () => {
    await request(app).get(`/api/posts/${draft.id}`).expect(404);
    await request(app).get(`/api/posts/${draft.id}`).set('Cookie', reader1).expect(404);
    await request(app).get(`/api/posts/${draft.id}`).set('Cookie', author1).expect(404);
    await request(app).get(`/api/posts/${draft.id}/comments`).expect(404);
    const { body } = await request(app).get(`/api/posts/${draft.id}`).set('Cookie', author5).expect(200);
    assert.equal(body.post.published, false);
  });

  it('treats a malformed or huge id as not found', async () => {
    await request(app).get('/api/posts/abc').expect(404);
    await request(app).get('/api/posts/99999999999').expect(404);
  });
});

describe('writing posts', () => {
  it('needs a session and the AUTHOR role', async () => {
    const post = { title: 'T', content: 'C' };
    await write(request(app).post('/api/posts')).send(post).expect(401);
    await write(request(app).post('/api/posts')).set('Cookie', reader1).send(post).expect(403);
    await request(app).get('/api/me/posts').set('Cookie', reader1).expect(403);
  });

  it('validates title and content', async () => {
    const res = await write(request(app).post('/api/posts'))
      .set('Cookie', author1)
      .send({ title: '  ', content: 'x'.repeat(50001) })
      .expect(422);
    assert.ok(res.body.details.title);
    assert.ok(res.body.details.content);
  });

  it('creates a draft, publishes it, unpublishes it and deletes it', async () => {
    const created = await write(request(app).post('/api/posts'))
      .set('Cookie', author1)
      .send({ title: 'Test essay', content: '## Hello\n\nBody.' })
      .expect(201);
    const { id } = created.body.post;
    assert.equal(created.headers.location, `/api/posts/${id}`);
    assert.equal(created.body.post.published, false);
    assert.equal(created.body.post.publishedAt, null);

    const published = await write(request(app).patch(`/api/posts/${id}`))
      .set('Cookie', author1)
      .send({ published: true })
      .expect(200);
    assert.equal(published.body.post.published, true);
    const firstDate = published.body.post.publishedAt;

    const again = await write(request(app).patch(`/api/posts/${id}`))
      .set('Cookie', author1)
      .send({ published: true, title: 'Test essay, revised' })
      .expect(200);
    assert.equal(again.body.post.publishedAt, firstDate, 're-sending true keeps the original date');
    assert.equal(again.body.post.title, 'Test essay, revised');

    await request(app).get(`/api/posts/${id}`).expect(200);
    await write(request(app).patch(`/api/posts/${id}`)).set('Cookie', author1).send({ published: false }).expect(200);
    await request(app).get(`/api/posts/${id}`).expect(404);

    await write(request(app).delete(`/api/posts/${id}`)).set('Cookie', author1).expect(204);
    await request(app).get(`/api/posts/${id}`).set('Cookie', author1).expect(404);
  });

  it('does not let one author change or delete another author’s post', async () => {
    await write(request(app).patch(`/api/posts/${draft.id}`)).set('Cookie', author1).send({ title: 'Mine now' }).expect(404);
    await write(request(app).delete(`/api/posts/${draft.id}`)).set('Cookie', author1).expect(404);
    const still = await prisma.post.findUnique({ where: { id: draft.id } });
    assert.equal(still.title, draft.title);
  });

  it('lists the author’s own posts, drafts included', async () => {
    const { body } = await request(app).get('/api/me/posts').set('Cookie', author5).expect(200);
    assert.ok(body.posts.some((post) => !post.published));
    assert.ok(body.posts.every((post) => post.author.username === 'author5'));
  });
});
