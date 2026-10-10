// Retries the Cloudinary deletions recorded in AssetDeletionFailure.
// Rows are removed once the asset is gone; failures are kept for a later run.
const prisma = require('../src/lib/prisma');
const { destroyAsset } = require('../src/services/storage');

async function main() {
  const failures = await prisma.assetDeletionFailure.findMany({ orderBy: { id: 'asc' } });
  if (failures.length === 0) {
    console.log('No pending asset deletions.');
    return;
  }
  let resolved = 0;
  let pending = 0;
  for (const failure of failures) {
    try {
      await destroyAsset(failure);
      await prisma.assetDeletionFailure.delete({ where: { id: failure.id } });
      resolved += 1;
    } catch (error) {
      pending += 1;
      console.error(`Still failing: ${failure.publicId} (${error.message})`);
    }
  }
  console.log(`Resolved: ${resolved}. Still pending: ${pending}.`);
  if (pending > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(`Retry failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
