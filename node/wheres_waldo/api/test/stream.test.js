const http = require('node:http');
const { request, prisma, createTestApp, resetData, useKnownHitboxes, registerAgent, CHARACTER_SLUGS, centerOf } = require('./helpers');

let app;
let clock;
let server;
let baseUrl;
let streams;

beforeAll(async () => {
  await resetData();
  await useKnownHitboxes();
});

beforeEach(async () => {
  ({ app, clock } = createTestApp({ config: { SSE_HEARTBEAT_MS: 40 } }));
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  streams = [];
});

afterEach(async () => {
  for (const stream of streams) stream.req.destroy();
  await app.close();
  await new Promise((resolve) => server.close(resolve));
});

afterAll(async () => {
  await resetData();
  await prisma.$disconnect();
});

// Opens the SSE stream and collects what arrives.
function listen() {
  return new Promise((resolve, reject) => {
    const req = http.get(`${baseUrl}/api/leaderboards/stream`, { headers: { Origin: 'http://localhost:5173' } }, (res) => {
      const stream = { req, res, text: '' };
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        stream.text += chunk;
      });
      streams.push(stream);
      resolve(stream);
    });
    req.on('error', reject);
  });
}

async function waitFor(condition, timeoutMs = 3000) {
  const deadline = Date.now() + timeoutMs;
  while (!condition()) {
    if (Date.now() > deadline) throw new Error('Timed out waiting');
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

const eventsIn = (stream) =>
  [...stream.text.matchAll(/event: leaderboard\ndata: (.+)\n\n/g)].map((match) => JSON.parse(match[1]));

async function play(agent, ms = 20000) {
  const game = (await agent.post('/api/maps/beach/games').expect(201)).body.game;
  const click = (slug) => agent.post(`/api/games/${game.id}/guesses`).send({ character: slug, ...centerOf(slug) });
  for (const slug of CHARACTER_SLUGS.slice(0, -1)) await click(slug).expect(200);
  clock.advance(ms);
  return click(CHARACTER_SLUGS[CHARACTER_SLUGS.length - 1]);
}

describe('GET /api/leaderboards/stream', () => {
  it('opens an event stream that CORS lets the client read', async () => {
    const stream = await listen();
    await waitFor(() => stream.text.includes(': connected'));

    expect(stream.res.statusCode).toBe(200);
    expect(stream.res.headers['content-type']).toMatch(/^text\/event-stream/);
    expect(stream.res.headers['cache-control']).toMatch(/no-cache/);
    expect(stream.res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(stream.res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('sends a heartbeat so idle connections stay open', async () => {
    const stream = await listen();
    await waitFor(() => stream.text.includes(': keep-alive'));
  });

  it('announces a ranked game that completes', async () => {
    const stream = await listen();
    await waitFor(() => stream.text.includes(': connected'));
    const { agent, username } = await registerAgent(app);

    const res = await play(agent, 23456);
    expect(res.status).toBe(200);

    await waitFor(() => eventsIn(stream).length === 1);
    expect(eventsIn(stream)[0]).toEqual({ type: 'ranked-game', mapSlug: 'beach', username, durationMs: 23456 });
  });

  it('reaches every connected client', async () => {
    const first = await listen();
    const second = await listen();
    await waitFor(() => first.text.includes(': connected') && second.text.includes(': connected'));
    const { agent } = await registerAgent(app);

    await play(agent);
    await waitFor(() => eventsIn(first).length === 1 && eventsIn(second).length === 1);
  });

  it('stays quiet for guests and for games that were not ranked', async () => {
    const stream = await listen();
    await waitFor(() => stream.text.includes(': connected'));

    await play(request.agent(app)); // a guest
    const { agent } = await registerAgent(app);
    await play(agent, 1000); // too fast to be ranked
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(eventsIn(stream)).toEqual([]);
  });

  it('forgets a client that disconnects', async () => {
    const stream = await listen();
    await waitFor(() => app.locals.events.clients.size === 1);

    stream.req.destroy();
    await waitFor(() => app.locals.events.clients.size === 0);
  });

  it('ends the streams when the app closes', async () => {
    const stream = await listen();
    await waitFor(() => app.locals.events.clients.size === 1);
    const ended = new Promise((resolve) => stream.res.on('end', resolve));

    app.locals.events.closeAll();
    await ended;
    expect(app.locals.events.clients.size).toBe(0);
  });
});
