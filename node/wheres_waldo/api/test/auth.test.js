const { request, prisma, createTestApp, resetData, uniqueName } = require('./helpers');

const password = 'a long password';
let app;

beforeAll(async () => {
  await resetData();
  ({ app } = createTestApp());
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

const register = (body) => request(app).post('/api/auth/register').send(body);

describe('POST /api/auth/register', () => {
  it('creates the player and opens a session in an HttpOnly, SameSite=Lax cookie', async () => {
    const username = uniqueName();
    const res = await register({ username, password, confirmPassword: password }).expect(201);

    expect(res.body.user).toEqual({ id: expect.any(Number), username });
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain(password);
    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toMatch(/^waldo\.sid=/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
    expect(cookie).toMatch(/Max-Age=604800|Expires=/);
  });

  it('keeps the username as typed but treats it as the same name in any case', async () => {
    const username = uniqueName('Case');
    await register({ username, password, confirmPassword: password }).expect(201);

    const res = await register({ username: username.toUpperCase(), password, confirmPassword: password }).expect(409);
    expect(res.body.errors.username).toMatch(/already taken/);
    expect(res.body.code).toBe('USERNAME_TAKEN');
    const stored = await prisma.user.findUnique({ where: { usernameLower: username.toLowerCase() } });
    expect(stored.username).toBe(username);
  });

  it('stores a hash, never the password', async () => {
    const username = uniqueName();
    await register({ username, password, confirmPassword: password }).expect(201);
    const stored = await prisma.user.findUnique({ where: { usernameLower: username.toLowerCase() } });
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(stored.passwordHash).not.toContain(password);
  });

  it.each([
    ['too short', 'ab', /3 to 20/],
    ['too long', 'a'.repeat(21), /3 to 20/],
    ['with spaces', 'no spaces', /letters, numbers/],
    ['with symbols', 'bad!name', /letters, numbers/],
  ])('answers 422 for a username %s', async (label, username, message) => {
    const res = await register({ username, password, confirmPassword: password }).expect(422);
    expect(res.body.errors.username).toMatch(message);
  });

  it('answers 422 with one message per invalid field', async () => {
    const res = await register({ username: 'x', password: 'short', confirmPassword: 'different' }).expect(422);
    expect(Object.keys(res.body.errors).sort()).toEqual(['confirmPassword', 'password', 'username']);
    expect(res.body.errors.password).toMatch(/at least 8/);
    expect(res.body.errors.confirmPassword).toBe('Passwords do not match.');
  });

  it('requires every field and rejects non-string values', async () => {
    const res = await register({}).expect(422);
    expect(res.body.errors.username).toBe('Username is required.');
    expect(res.body.errors.password).toBe('Password is required.');
    await register({ username: { $ne: null }, password: 12345678, confirmPassword: 12345678 }).expect(422);
  });

  it('rejects a password longer than bcrypt can use', async () => {
    const long = 'a'.repeat(73);
    const res = await register({ username: uniqueName(), password: long, confirmPassword: long }).expect(422);
    expect(res.body.errors.password).toMatch(/too long/);
  });

  it('answers 400 for malformed JSON', async () => {
    await request(app).post('/api/auth/register').set('Content-Type', 'application/json').send('{"username":').expect(400);
  });
});

describe('POST /api/auth/login', () => {
  const username = uniqueName('login');

  beforeAll(async () => {
    await register({ username, password, confirmPassword: password }).expect(201);
  });

  it('logs in with the username in any case', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: username.toUpperCase(), password }).expect(200);
    expect(res.body.user.username).toBe(username);
    expect(res.headers['set-cookie'][0]).toMatch(/^waldo\.sid=/);
  });

  it('gives the same 401 for a wrong password and an unknown user', async () => {
    const wrong = await request(app).post('/api/auth/login').send({ username, password: 'not the password' });
    const unknown = await request(app).post('/api/auth/login').send({ username: 'nobody_here', password: 'not the password' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body).toEqual(unknown.body);
    expect(wrong.headers['set-cookie']).toBeUndefined();
  });

  it('answers 422 when fields are missing', async () => {
    const res = await request(app).post('/api/auth/login').send({}).expect(422);
    expect(res.body.errors.username).toBeDefined();
    expect(res.body.errors.password).toBeDefined();
  });
});

describe('session: GET /api/auth/me and POST /api/auth/logout', () => {
  it('answers { user: null } to a guest and does not give guests a cookie', async () => {
    const res = await request(app).get('/api/auth/me').expect(200);
    expect(res.body).toEqual({ user: null });
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('remembers the player across requests until logout', async () => {
    const username = uniqueName('me');
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({ username, password, confirmPassword: password }).expect(201);

    expect((await agent.get('/api/auth/me').expect(200)).body.user.username).toBe(username);
    await agent.post('/api/auth/logout').expect(204);
    expect((await agent.get('/api/auth/me').expect(200)).body).toEqual({ user: null });
  });

  it('answers 204 to a logout without a session', async () => {
    await request(app).post('/api/auth/logout').expect(204);
  });

  it('stores the session in the database, not in memory', async () => {
    const before = await prisma.session.count();
    await registerLike();
    expect(await prisma.session.count()).toBe(before + 1);
  });

  it('drops the session when the account disappears', async () => {
    const username = uniqueName('gone');
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({ username, password, confirmPassword: password }).expect(201);
    await prisma.user.delete({ where: { usernameLower: username.toLowerCase() } });
    expect((await agent.get('/api/auth/me').expect(200)).body).toEqual({ user: null });
  });
});

async function registerLike() {
  await register({ username: uniqueName('s'), password, confirmPassword: password }).expect(201);
}

describe('GET /api/auth/username-available', () => {
  const taken = uniqueName('taken');

  beforeAll(async () => {
    await register({ username: taken, password, confirmPassword: password }).expect(201);
  });

  it('says a free name is available', async () => {
    const res = await request(app).get('/api/auth/username-available').query({ username: uniqueName('free') }).expect(200);
    expect(res.body.available).toBe(true);
    expect(res.body.errors).toBeUndefined();
  });

  it('says a taken name is not, in any case, with the message for the field', async () => {
    const res = await request(app).get('/api/auth/username-available').query({ username: taken.toUpperCase() }).expect(200);
    expect(res.body.available).toBe(false);
    expect(res.body.errors.username).toMatch(/already taken/);
  });

  it('answers 422 for a name that is not valid at all', async () => {
    const res = await request(app).get('/api/auth/username-available').query({ username: 'a b' }).expect(422);
    expect(res.body.errors.username).toMatch(/3 to 20/);
    await request(app).get('/api/auth/username-available').expect(422);
  });
});

describe('cookie flags and rate limits', () => {
  it('marks the cookie Secure when COOKIE_SECURE is on and the request arrived over HTTPS', async () => {
    const secure = createTestApp({ config: { COOKIE_SECURE: true, TRUST_PROXY: 1 } }).app;
    const res = await request(secure)
      .post('/api/auth/register')
      .set('X-Forwarded-Proto', 'https')
      .send({ username: uniqueName(), password, confirmPassword: password })
      .expect(201);
    expect(res.headers['set-cookie'][0]).toMatch(/; Secure/);
    await secure.close();
  });

  it('limits login attempts', async () => {
    const limited = createTestApp({ config: { AUTH_RATE_LIMIT: 3 } }).app;
    const attempt = () => request(limited).post('/api/auth/login').send({ username: 'nobody_here', password: 'whatever pass' });
    for (let i = 0; i < 3; i += 1) await attempt().expect(401);
    const res = await attempt().expect(429);
    expect(res.body.code).toBe('RATE_LIMITED');
    await limited.close();
  });

  it('shares the limit between login and registration', async () => {
    const limited = createTestApp({ config: { AUTH_RATE_LIMIT: 2 } }).app;
    await request(limited).post('/api/auth/login').send({ username: 'nobody_here', password: 'whatever pass' }).expect(401);
    await request(limited).post('/api/auth/register').send({}).expect(422);
    await request(limited).post('/api/auth/register').send({}).expect(429);
    await limited.close();
  });
});
