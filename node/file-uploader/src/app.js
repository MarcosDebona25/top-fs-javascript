require('dotenv/config');
const path = require('path');
const express = require('express');
const passport = require('./config/passport');
const sessionMiddleware = require('./config/session');
const prisma = require('./lib/prisma');
const { HttpError } = require('./lib/http');
const { flash, viewLocals } = require('./middlewares/locals');
const authRoutes = require('./routes/auth');
const folderRoutes = require('./routes/folders');
const fileRoutes = require('./routes/files');
const shareRoutes = require('./routes/shares');
const publicShareRoutes = require('./routes/public-share');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(sessionMiddleware());
app.use(passport.initialize());
app.use(passport.session());
app.use(flash);
app.use(viewLocals);

app.get('/', async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/log-in');
  const root = await prisma.folder.findFirst({
    where: { ownerId: req.user.id, parentId: null },
    select: { id: true },
  });
  if (!root) throw new HttpError(404, 'Root folder not found');
  return res.redirect(`/folders/${root.id}`);
});

app.use(authRoutes);
app.use('/folders', folderRoutes);
app.use('/files', fileRoutes);
app.use('/shares', shareRoutes);
app.use('/share', publicShareRoutes);

app.use((req, res, next) => next(new HttpError(404, 'Page not found')));

// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  let status = error.status || 500;
  if (error.code === 'P2025') status = 404;
  if (status === 500) console.error(error);
  const message = status === 500 ? null : error.message;
  return res.status(status).render('errors/error', { title: `Error ${status}`, status, message });
});

const port = Number(process.env.PORT) || 3000;
if (require.main === module) {
  app.listen(port, () => console.log(`Listening on http://localhost:${port}`));
}

module.exports = app;
