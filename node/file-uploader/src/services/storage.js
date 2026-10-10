const crypto = require('crypto');
const prisma = require('../lib/prisma');
const { cloudinary, assertConfigured } = require('../config/cloudinary');
const { FILE_TYPES } = require('../lib/file-types');

const ASSET_PREFIX = 'file-uploader';

function buildPublicId(ownerId, extension) {
  const id = crypto.randomUUID();
  const base = `${ASSET_PREFIX}/${ownerId}/${id}`;
  // Raw assets keep the extension in the public_id; image assets get it from their format.
  return FILE_TYPES[extension].resourceType === 'raw' ? `${base}.${extension}` : base;
}

// Uploads a buffer. Returns { url, publicId, resourceType }.
function uploadBuffer(buffer, { ownerId, extension }) {
  assertConfigured();
  const resourceType = FILE_TYPES[extension].resourceType;
  const publicId = buildPublicId(ownerId, extension);
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { public_id: publicId, resource_type: resourceType, overwrite: false },
      (error, result) => {
        if (error) return reject(error);
        return resolve({ url: result.secure_url, publicId: result.public_id, resourceType });
      }
    );
    stream.end(buffer);
  });
}

async function destroyAsset({ publicId, resourceType }) {
  assertConfigured();
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    type: 'upload',
    invalidate: true,
  });
  if (result.result !== 'ok' && result.result !== 'not found') {
    throw new Error(`Unexpected Cloudinary response: ${result.result}`);
  }
}

// Only letters, digits, underscore and hyphen survive: safe for the fl_attachment flag.
function sanitizeAttachmentName(name) {
  const cleaned = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned.slice(0, 100) || 'download';
}

// Download URL generated on demand, with the current file name as attachment name.
function getDownloadUrl(file) {
  assertConfigured();
  const dot = file.name.lastIndexOf('.');
  const baseName = dot > 0 ? file.name.slice(0, dot) : file.name;
  const attachment = sanitizeAttachmentName(baseName);
  const options = {
    resource_type: file.resourceType,
    type: 'upload',
    secure: true,
    flags: `attachment:${attachment}`,
  };
  if (file.resourceType === 'image') options.format = file.extension === 'jpeg' ? 'jpg' : file.extension;
  return cloudinary.url(file.publicId, options);
}

async function recordFailure(asset, error) {
  console.error(`Failed to delete asset ${asset.publicId} (${asset.resourceType}):`, error.message);
  try {
    await prisma.assetDeletionFailure.create({
      data: {
        publicId: asset.publicId,
        resourceType: asset.resourceType,
        errorMessage: String(error.message).slice(0, 500),
      },
    });
  } catch (recordError) {
    console.error('Failed to record asset deletion failure:', recordError.message);
  }
}

// Best effort: never throws. Each failure is logged and stored for a later retry.
async function deleteAssetsBestEffort(assets) {
  for (const asset of assets) {
    try {
      await destroyAsset(asset);
    } catch (error) {
      await recordFailure(asset, error);
    }
  }
}

module.exports = {
  uploadBuffer,
  destroyAsset,
  deleteAssetsBestEffort,
  recordFailure,
  getDownloadUrl,
  sanitizeAttachmentName,
};
