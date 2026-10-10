const prisma = require('../lib/prisma');

// Replaced by the Cloudinary implementation in phase 4.
async function destroyAsset() {
  throw new Error('Asset storage is not configured yet.');
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

module.exports = { deleteAssetsBestEffort, recordFailure };
