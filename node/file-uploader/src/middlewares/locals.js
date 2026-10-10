const prisma = require('../lib/prisma');
const { formatSize, typeLabel, typeDescription } = require('../lib/files');
const { fileIcon } = require('../lib/file-icons');

const dateFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

// Minimal session-based flash: req.flash(type, message) now, shown on the next render.
function flash(req, res, next) {
  req.flash = (type, message) => {
    req.session.flash = { type, message };
  };
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
}

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

async function viewLocals(req, res, next) {
  res.locals.appName = 'File Uploader';
  res.locals.currentUser = req.user || null;
  res.locals.rootFolderId = null;
  res.locals.formatDate = (date) => dateFormatter.format(date);
  res.locals.formatDateTime = (date) => dateTimeFormatter.format(date);
  res.locals.fileIcon = fileIcon;
  res.locals.formatSize = formatSize;
  res.locals.typeLabel = typeLabel;
  res.locals.typeDescription = typeDescription;
  if (req.user) {
    const root = await prisma.folder.findFirst({
      where: { ownerId: req.user.id, parentId: null },
      select: { id: true },
    });
    res.locals.rootFolderId = root ? root.id : null;
  }
  next();
}

module.exports = { flash, viewLocals };
