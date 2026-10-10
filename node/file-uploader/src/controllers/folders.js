const { validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { HttpError, parseId, mapErrors } = require('../lib/http');
const { uniqueViolationField } = require('../lib/prisma-errors');
const { getSubtreeIds, getBreadcrumbs } = require('../services/folder-tree');
const { deleteAssetsBestEffort } = require('../services/storage');

async function findOwnedFolder(id, ownerId) {
  const folder = await prisma.folder.findFirst({ where: { id, ownerId } });
  if (!folder) throw new HttpError(404, 'Folder not found');
  return folder;
}

function assertNotRoot(folder) {
  if (folder.parentId === null) {
    throw new HttpError(403, "The root folder can't be renamed or deleted.");
  }
}

// Subfolders and files inside the folder, at any depth. Shown before deleting it.
async function countContents(folder, ownerId) {
  const ids = await getSubtreeIds(folder.id, ownerId);
  const fileCount = await prisma.file.count({ where: { folderId: { in: ids }, ownerId } });
  return { folderCount: ids.length - 1, fileCount };
}

async function renderFolder(req, res, folder, { status = 200, errors = {}, values = {}, openForm = null } = {}) {
  const ownerId = req.user.id;
  const isRoot = folder.parentId === null;
  const [breadcrumbs, folders, files, deleteCounts] = await Promise.all([
    getBreadcrumbs(folder.id, ownerId),
    prisma.folder.findMany({ where: { parentId: folder.id, ownerId }, orderBy: { name: 'asc' } }),
    prisma.file.findMany({ where: { folderId: folder.id, ownerId }, orderBy: { name: 'asc' } }),
    isRoot ? null : countContents(folder, ownerId),
  ]);
  res.status(status).render('folders/show', {
    title: folder.name,
    folder,
    isRoot,
    deleteCounts,
    breadcrumbs,
    folders,
    files,
    errors,
    values,
    openForm,
  });
}

async function show(req, res) {
  const folder = await findOwnedFolder(parseId(req.params.id), req.user.id);
  await renderFolder(req, res, folder);
}

async function createSubfolder(req, res) {
  const parent = await findOwnedFolder(parseId(req.params.id), req.user.id);
  const values = { name: req.body.name };
  const fail = (errors) => renderFolder(req, res, parent, { status: 422, errors, values, openForm: 'create' });

  const result = validationResult(req);
  if (!result.isEmpty()) return fail(mapErrors(result));

  try {
    await prisma.folder.create({ data: { name: req.body.name, ownerId: req.user.id, parentId: parent.id } });
  } catch (error) {
    if (uniqueViolationField(error) === 'name') {
      return fail({ name: 'A folder with this name already exists here.' });
    }
    throw error;
  }
  req.flash('success', `Folder "${req.body.name}" created.`);
  return res.redirect(`/folders/${parent.id}`);
}

// Pages behind the dialog triggers, reached only when the dialog script didn't run.
function showForm(form) {
  return async (req, res) => {
    const folder = await findOwnedFolder(parseId(req.params.id), req.user.id);
    if (form === 'rename') assertNotRoot(folder);
    const titles = { create: 'New folder', upload: 'Upload file', rename: `Rename ${folder.name}` };
    res.render('folders/form', { title: titles[form], folder, form, errors: {}, values: {} });
  };
}

async function rename(req, res) {
  const folder = await findOwnedFolder(parseId(req.params.id), req.user.id);
  assertNotRoot(folder);
  const values = { renameName: req.body.name };
  const fail = (errors) =>
    renderFolder(req, res, folder, { status: 422, errors: { renameName: errors.name }, values, openForm: 'rename' });

  const result = validationResult(req);
  if (!result.isEmpty()) return fail(mapErrors(result));

  try {
    await prisma.folder.updateMany({
      where: { id: folder.id, ownerId: req.user.id },
      data: { name: req.body.name },
    });
  } catch (error) {
    if (uniqueViolationField(error) === 'name') {
      return fail({ name: 'A folder with this name already exists here.' });
    }
    throw error;
  }
  req.flash('success', 'Folder renamed.');
  return res.redirect(`/folders/${folder.id}`);
}

async function showDelete(req, res) {
  const folder = await findOwnedFolder(parseId(req.params.id), req.user.id);
  assertNotRoot(folder);
  const counts = await countContents(folder, req.user.id);
  res.render('folders/delete', { title: `Delete ${folder.name}`, folder, ...counts });
}

async function remove(req, res) {
  const folder = await findOwnedFolder(parseId(req.params.id), req.user.id);
  assertNotRoot(folder);
  const ids = await getSubtreeIds(folder.id, req.user.id);
  const assets = await prisma.file.findMany({
    where: { folderId: { in: ids }, ownerId: req.user.id },
    select: { publicId: true, resourceType: true },
  });

  const { count } = await prisma.folder.deleteMany({ where: { id: folder.id, ownerId: req.user.id } });
  if (count === 0) throw new HttpError(404, 'Folder not found');

  await deleteAssetsBestEffort(assets);
  req.flash('success', `Folder "${folder.name}" deleted.`);
  res.redirect(`/folders/${folder.parentId}`);
}

module.exports = { show, showForm, createSubfolder, rename, showDelete, remove, findOwnedFolder, renderFolder };
