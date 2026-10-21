const express = require('express');
const helmet = require('helmet');
const { loadConfig } = require('./lib/env');
const defaultPrisma = require('./lib/prisma');
const { HttpError } = require('./lib/http');
const { LeaderboardEvents } = require('./lib/events');
const createCors = require('./config/cors');
const createSession = require('./config/session');
const createPassport = require('./config/passport');
const createLimiters = require('./middlewares/rate-limit');
const createLeaderboards = require('./services/leaderboards');
const createMaps = require('./services/maps');
const createGames = require('./services/games');
const createAuthRoutes = require('./routes/auth');
const createMapsRoutes = require('./routes/maps');
const createGamesRoutes = require('./routes/games');

// Builds the app. `now` is the clock every game timestamp comes from (the tests drive it by hand);
// `config` overrides the environment (the tests use it to change the game rules).
function createApp({ now = () => new Date(), config: overrides = {}, prisma = defaultPrisma } = {}) {
  const config = { ...loadConfig(), ...overrides };
  const session = createSession(config);
  const passport = createPassport({ prisma, config });
  const events = new LeaderboardEvents({ heartbeatMs: config.SSE_HEARTBEAT_MS });
  const ctx = {
    prisma,
    now,
    config,
    events,
    passport,
    limiters: createLimiters(config),
    sessionCookieName: session.cookieName,
  };
  ctx.leaderboards = createLeaderboards(ctx);
  ctx.maps = createMaps(ctx);
  ctx.games = createGames(ctx);

  const app = express();
  if (config.TRUST_PROXY) app.set('trust proxy', config.TRUST_PROXY);

  // Order matters: CORS answers preflights before anything asks for a session.
  app.use(helmet());
  app.use(createCors(config));
  app.use(express.json());
  app.use(session.middleware);
  app.use(passport.initialize());
  app.use(passport.session());

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', createAuthRoutes(ctx));
  app.use('/api/maps', createMapsRoutes(ctx));
  app.use('/api/games', createGamesRoutes(ctx));

  app.use((req, res, next) => next(new HttpError(404, 'Not found')));

  // eslint-disable-next-line no-unused-vars
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    let status = error.status || 500;
    if (error.type === 'entity.parse.failed') status = 400;
    if (status === 500) console.error(error);
    const message = status === 400 && error.type === 'entity.parse.failed' ? 'Malformed JSON' : error.message;
    const body = { error: status === 500 ? 'Internal server error' : message };
    if (error.code && status !== 500 && typeof error.code === 'string' && error instanceof HttpError) body.code = error.code;
    if (error.errors) body.errors = error.errors;
    if (error.extra) Object.assign(body, error.extra);
    return res.status(status).json(body);
  });

  // Releases what the app holds open: SSE streams and the session store's connections.
  app.close = async () => {
    events.closeAll();
    await session.close();
  };
  return app;
}

if (require.main === module) {
  const app = createApp();
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => console.log(`Listening on http://localhost:${port}`));
}

module.exports = { createApp };
