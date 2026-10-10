const prisma = require('../lib/prisma');

// Ids of the folder and all its descendants. Empty when the folder is not owned by ownerId.
async function getSubtreeIds(folderId, ownerId) {
  const rows = await prisma.$queryRaw`
    WITH RECURSIVE subtree AS (
      SELECT id FROM "Folder" WHERE id = ${folderId} AND "ownerId" = ${ownerId}
      UNION ALL
      SELECT f.id FROM "Folder" f JOIN subtree s ON f."parentId" = s.id
    )
    SELECT id FROM subtree`;
  return rows.map((row) => row.id);
}

// Path from the root folder down to the given folder, for breadcrumbs.
async function getBreadcrumbs(folderId, ownerId) {
  const rows = await prisma.$queryRaw`
    WITH RECURSIVE ancestors AS (
      SELECT id, name, "parentId", 0 AS depth FROM "Folder"
      WHERE id = ${folderId} AND "ownerId" = ${ownerId}
      UNION ALL
      SELECT f.id, f.name, f."parentId", a.depth + 1 FROM "Folder" f
      JOIN ancestors a ON f.id = a."parentId"
    )
    SELECT id, name FROM ancestors ORDER BY depth DESC`;
  return rows.map((row) => ({ id: row.id, name: row.name }));
}

module.exports = { getSubtreeIds, getBreadcrumbs };
