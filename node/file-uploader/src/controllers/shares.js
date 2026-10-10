const crypto = require('crypto');
const { validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { HttpError, parseId, mapErrors } = require('../lib/http');
const { ALLOWED_DURATIONS } = require('../validators/share');
const { getBreadcrumbs } = require('../services/folder-tree');

const DAY_MS = 24 * 60 * 60 * 1000;

async function findOwnedFolder(id, ownerId) {
  const folder = await prisma.folder.findFirst({ where: { id, ownerId } });
  if (!folder) throw new HttpError(404, 'Folder not found');
  return folder;
}

async function renderShares(req, res, folder, { status = 200, errors = {}, values = {} } = {}) {
  const [breadcrumbs, links] = await Promise.all([
    getBreadcrumbs(folder.id, req.user.id),
    prisma.shareLink.findMany({
      where: { folderId: folder.id, ownerId: req.user.id },
      orderBy: { createdAt: 'desc' },
    }),
  ]);
  const now = new Date();
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.status(status).render('shares/index', {
    title: `Share links for ${folder.name}`,
    folder,
    breadcrumbs,
    durations: ALLOWED_DURATIONS,
    errors,
    values,
    links: links.map((link) => ({
      ...link,
      url: `${baseUrl}/share/${link.token}`,
      active: link.expiresAt > now,
    })),
  });
}

async function index(req, res) {
  const folder = await findOwnedFolder(parseId(req.params.id), req.user.id);
  await renderShares(req, res, folder);
}

async function create(req, res) {
  const folder = await findOwnedFolder(parseId(req.params.id), req.user.id);
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return renderShares(req, res, folder, {
      status: 422,
      errors: mapErrors(result),
      values: { durationDays: req.body.durationDays },
    });
  }

  const durationDays = req.body.durationDays;
  await prisma.shareLink.create({
    data: {
      token: crypto.randomUUID(),
      folderId: folder.id,
      ownerId: req.user.id,
      durationDays,
      expiresAt: new Date(Date.now() + durationDays * DAY_MS),
    },
  });
  req.flash('success', `Share link created. It expires in ${durationDays} ${durationDays === 1 ? 'day' : 'days'}.`);
  return res.redirect(`/folders/${folder.id}/shares`);
}

async function remove(req, res) {
  const link = await prisma.shareLink.findFirst({
    where: { id: parseId(req.params.id), ownerId: req.user.id },
    select: { id: true, folderId: true },
  });
  if (!link) throw new HttpError(404, 'Share link not found');

  await prisma.shareLink.deleteMany({ where: { id: link.id, ownerId: req.user.id } });
  req.flash('success', 'Share link deleted.');
  res.redirect(`/folders/${link.folderId}/shares`);
}

module.exports = { index, create, remove };
