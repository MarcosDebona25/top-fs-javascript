const path = require('path');
const { validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { HttpError, parseId, mapErrors } = require('../lib/http');
const { FILE_TYPES, MAX_BASE_NAME_LENGTH, splitFileName } = require('../lib/file-types');
const { getBreadcrumbs } = require('../services/folder-tree');
const storage = require('../services/storage');
const folders = require('./folders');

async function findOwnedFile(id, ownerId) {
  const file = await prisma.file.findFirst({ where: { id, ownerId } });
  if (!file) throw new HttpError(404, 'File not found');
  return file;
}

async function renderFile(req, res, file, { status = 200, errors = {}, values = {}, openForm = null } = {}) {
  const breadcrumbs = await getBreadcrumbs(file.folderId, req.user.id);
  const { base } = splitFileName(file.name);
  res.status(status).render('files/show', {
    title: file.name,
    file,
    baseName: base,
    breadcrumbs,
    errors,
    values,
    openForm,
  });
}

async function show(req, res) {
  const file = await findOwnedFile(parseId(req.params.id), req.user.id);
  await renderFile(req, res, file);
}

async function upload(req, res) {
  const folder = await folders.findOwnedFolder(parseId(req.params.id), req.user.id);
  const fail = (message, status = 422) =>
    folders.renderFolder(req, res, folder, { status, errors: { file: message } });

  if (req.uploadError) return fail(req.uploadError);
  if (!req.file) return fail('Select a file to upload.');

  const { base, extension } = splitFileName(path.basename(req.file.originalname.replace(/\\/g, '/')));
  const cleanBase = base.replace(/[/\\]/g, '_').trim();
  if (!cleanBase) return fail('The file needs a name before its extension. Rename it and select it again.');
  if (cleanBase.length > MAX_BASE_NAME_LENGTH) {
    return fail(`File name is too long (max ${MAX_BASE_NAME_LENGTH} characters). Rename it and select it again.`);
  }

  let asset;
  try {
    asset = await storage.uploadBuffer(req.file.buffer, { ownerId: req.user.id, extension });
  } catch (error) {
    console.error('Cloudinary upload failed:', error.message);
    return fail('The upload failed. Select the file again and retry.', 502);
  }

  try {
    await prisma.file.create({
      data: {
        name: `${cleanBase}.${extension}`,
        extension,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: asset.url,
        publicId: asset.publicId,
        resourceType: asset.resourceType,
        folderId: folder.id,
        ownerId: req.user.id,
      },
    });
  } catch (error) {
    // Compensation: the database row failed, so remove the asset that was just uploaded.
    try {
      await storage.destroyAsset(asset);
    } catch (destroyError) {
      await storage.recordFailure(asset, destroyError);
    }
    throw error;
  }

  req.flash('success', `File "${cleanBase}.${extension}" uploaded.`);
  return res.redirect(`/folders/${folder.id}`);
}

async function rename(req, res) {
  const file = await findOwnedFile(parseId(req.params.id), req.user.id);
  const values = { name: req.body.name };

  const result = validationResult(req);
  if (!result.isEmpty()) {
    return renderFile(req, res, file, { status: 422, errors: mapErrors(result), values, openForm: 'rename' });
  }

  // The extension always comes from the database, never from the request.
  const newName = `${req.body.name}.${file.extension}`;
  await prisma.file.updateMany({ where: { id: file.id, ownerId: req.user.id }, data: { name: newName } });
  req.flash('success', 'File renamed.');
  return res.redirect(`/files/${file.id}`);
}

async function remove(req, res) {
  const file = await findOwnedFile(parseId(req.params.id), req.user.id);
  const { count } = await prisma.file.deleteMany({ where: { id: file.id, ownerId: req.user.id } });
  if (count === 0) throw new HttpError(404, 'File not found');

  await storage.deleteAssetsBestEffort([{ publicId: file.publicId, resourceType: file.resourceType }]);
  req.flash('success', `File "${file.name}" deleted.`);
  res.redirect(`/folders/${file.folderId}`);
}

async function download(req, res) {
  const file = await findOwnedFile(parseId(req.params.id), req.user.id);
  res.redirect(storage.getDownloadUrl(file));
}

module.exports = { show, upload, rename, remove, download };
