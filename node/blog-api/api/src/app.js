require('./lib/env');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');
const corsMiddleware = require('./config/cors');
const { csrfGuard } = require('./middlewares/csrf');
const { HttpError } = require('./lib/http');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const meRoutes = require('./routes/me');

const app = express();

// Order matters: CORS answers preflights before anything asks for a session,
// and the CSRF guard runs before every route that writes.
app.use(helmet());
app.use(corsMiddleware);
app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());
app.use('/api', csrfGuard);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/me', meRoutes);

app.use((req, res, next) => next(new HttpError(404, 'Not found')));

// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  let status = error.status || 500;
  if (error.type === 'entity.parse.failed') status = 400;
  if (error.code === 'P2025') status = 404;
  if (status === 500) console.error(error);
  const message = status === 400 && error.type === 'entity.parse.failed' ? 'Malformed JSON' : error.message;
  const body = { error: status === 500 ? 'Internal server error' : message };
  if (error.details) body.details = error.details;
  return res.status(status).json(body);
});

const port = Number(process.env.PORT) || 3000;
if (require.main === module) {
  app.listen(port, () => console.log(`Listening on http://localhost:${port}`));
}

module.exports = app;
