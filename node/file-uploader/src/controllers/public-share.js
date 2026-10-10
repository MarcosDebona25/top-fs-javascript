const prisma = require('../lib/prisma');
const { HttpError, parseId } = require('../lib/http');
const { getSubtreeIds, getBreadcrumbs } = require('../services/folder-tree');
const storage = require('../services/storage');

// Expiry is checked inside the query on every request.
async function resolveShare(token) {
  const link = await prisma.shareLink.findFirst({
    where: { token, expiresAt: { gt: new Date() } },
    select: { token: true, folderId: true, ownerId: true, expiresAt: true },
  });
  if (link) return link;

  const existing = await prisma.shareLink.findUnique({ where: { token }, select: { id: true } });
  if (existing) throw new HttpError(410, 'This share link has expired.');
  throw new HttpError(404, 'Share link not found');
}

async function loadShare(req) {
  const link = await resolveShare(req.params.token);
  const subtreeIds = await getSubtreeIds(link.folderId, link.ownerId);
  return { link, subtreeIds };
}

async function breadcrumbsFor(link, folderId) {
  const path = await getBreadcrumbs(folderId, link.ownerId);
  const start = path.findIndex((crumb) => crumb.id === link.folderId);
  return path.slice(start < 0 ? 0 : start).map((crumb) => ({
    name: crumb.name,
    href: crumb.id === link.folderId ? `/share/${link.token}` : `/share/${link.token}/folders/${crumb.id}`,
  }));
}

async function renderFolder(req, res, link, folderId) {
  const folder = await prisma.folder.findFirst({ where: { id: folderId, ownerId: link.ownerId } });
  if (!folder) throw new HttpError(404, 'Folder not found');
  const [breadcrumbs, folders, files] = await Promise.all([
    breadcrumbsFor(link, folder.id),
    prisma.folder.findMany({ where: { parentId: folder.id, ownerId: link.ownerId }, orderBy: { name: 'asc' } }),
    prisma.file.findMany({ where: { folderId: folder.id, ownerId: link.ownerId }, orderBy: { name: 'asc' } }),
  ]);
  res.render('share/folder', {
    title: folder.name,
    publicView: true,
    token: link.token,
    expiresAt: link.expiresAt,
    folder,
    breadcrumbs,
    folders,
    files,
  });
}

async function showShared(req, res) {
  const { link } = await loadShare(req);
  await renderFolder(req, res, link, link.folderId);
}

async function showSubfolder(req, res) {
  const folderId = parseId(req.params.folderId);
  const { link, subtreeIds } = await loadShare(req);
  if (!subtreeIds.includes(folderId)) throw new HttpError(404, 'Folder not found');
  await renderFolder(req, res, link, folderId);
}

async function findSharedFile(req) {
  const fileId = parseId(req.params.fileId);
  const { link, subtreeIds } = await loadShare(req);
  const file = await prisma.file.findFirst({
    where: { id: fileId, ownerId: link.ownerId, folderId: { in: subtreeIds } },
  });
  if (!file) throw new HttpError(404, 'File not found');
  return { link, file };
}

async function showFile(req, res) {
  const { link, file } = await findSharedFile(req);
  const breadcrumbs = await breadcrumbsFor(link, file.folderId);
  res.render('share/file', {
    title: file.name,
    publicView: true,
    token: link.token,
    file,
    breadcrumbs,
  });
}

async function download(req, res) {
  const { file } = await findSharedFile(req);
  res.redirect(storage.getDownloadUrl(file));
}

module.exports = { showShared, showSubfolder, showFile, download };
