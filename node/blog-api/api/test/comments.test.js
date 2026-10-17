const { after, before, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { request, app, prisma, write, logIn, passwords } = require('./helpers');

const READER_ORIGIN = 'http://localhost:5173';
let reader1;
let reader2;
let author1;
let published;
let draft;

before(async () => {
  reader1 = await logIn('reader1', passwords.reader);
  reader2 = await logIn('reader2', passwords.reader);
  author1 = await logIn('author1', passwords.author);
  published = await prisma.post.findFirst({ where: { publishedAt: { not: null }, author: { username: 'author1' } } });
  draft = await prisma.post.findFirst({ where: { publishedAt: null } });
});

after(() => prisma.$disconnect());

const post = (path, cookie, body) => write(request(app).post(path), READER_ORIGIN).set('Cookie', cookie).send(body);
const patch = (path, cookie, body) => write(request(app).patch(path), READER_ORIGIN).set('Cookie', cookie).send(body);
const del = (path, cookie) => write(request(app).delete(path), READER_ORIGIN).set('Cookie', cookie);

describe('comments', () => {
  it('can be read by anyone on a published post, oldest first', async () => {
    const { body } = await request(app).get(`/api/posts/${published.id}/comments`).expect(200);
    const dates = body.comments.map((c) => Date.parse(c.createdAt));
    assert.deepEqual(dates, [...dates].sort((a, b) => a - b));
  });

  it('need a session and a published post', async () => {
    await write(request(app).post(`/api/posts/${published.id}/comments`), READER_ORIGIN).send({ content: 'Hi' }).expect(401);
    await post(`/api/posts/${draft.id}/comments`, reader1, { content: 'Hi' }).expect(404);
  });

  it('are stored as written: HTML is not stripped, the client escapes it', async () => {
    const res = await post(`/api/posts/${published.id}/comments`, reader1, { content: '<b>bold</b>' }).expect(201);
    assert.equal(res.body.comment.content, '<b>bold</b>');
    await del(`/api/comments/${res.body.comment.id}`, reader1).expect(204);
  });

  it('validate content length', async () => {
    await post(`/api/posts/${published.id}/comments`, reader1, { content: '   ' }).expect(422);
    await post(`/api/posts/${published.id}/comments`, reader1, { content: 'x'.repeat(1001) }).expect(422);
  });

  it('can only be edited and deleted by their own author, not even by the post’s author', async () => {
    const created = await post(`/api/posts/${published.id}/comments`, reader1, { content: 'First thought' }).expect(201);
    const { id } = created.body.comment;
    assert.equal(created.body.comment.editedAt, null);

    await patch(`/api/comments/${id}`, reader2, { content: 'Hijacked' }).expect(403);
    await patch(`/api/comments/${id}`, author1, { content: 'Moderated' }).expect(403);
    await del(`/api/comments/${id}`, author1).expect(403);

    const edited = await patch(`/api/comments/${id}`, reader1, { content: 'Second thought' }).expect(200);
    assert.equal(edited.body.comment.content, 'Second thought');
    assert.ok(edited.body.comment.editedAt);

    await del(`/api/comments/${id}`, reader1).expect(204);
    await del(`/api/comments/${id}`, reader1).expect(404);
  });

  it('go away with their post', async () => {
    const created = await write(request(app).post('/api/posts'))
      .set('Cookie', author1)
      .send({ title: 'Short-lived', content: 'Body' })
      .expect(201);
    const { id } = created.body.post;
    await write(request(app).patch(`/api/posts/${id}`)).set('Cookie', author1).send({ published: true }).expect(200);
    await post(`/api/posts/${id}/comments`, reader1, { content: 'Hello' }).expect(201);

    await write(request(app).delete(`/api/posts/${id}`)).set('Cookie', author1).expect(204);
    assert.equal(await prisma.comment.count({ where: { postId: id } }), 0);
  });
});
