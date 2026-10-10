// Repeatable seed: removes the seed users (and everything they own), the sessions and the
// deletion failures, then recreates users, folder trees, files and share links.
// Files are uploaded to Cloudinary under a deterministic public_id prefix.
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const prisma = require('../src/lib/prisma');
const { cloudinary, assertConfigured } = require('../src/config/cloudinary');
const { FILE_TYPES } = require('../src/lib/file-types');

const SEED_PREFIX = 'file-uploader/seed';
const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const PASSWORD = 'Seed-Pass-2026';
const DAY_MS = 24 * 60 * 60 * 1000;

const ACTIVE_TOKEN = '5f0c6a3e-7d1b-4b52-9c3a-2f6a0e1d8a01';
const EXPIRED_TOKEN = '8b2e41c7-3a9d-4f6e-b1c5-9d7e5a2c4b02';
const BOB_TOKEN = 'c4d9a7f2-1e83-4a60-8b3d-6e2f1a9c7d03';

// Each folder: { name, files: [[displayName, fixtureExtension]], children: [...] }
const USERS = [
  {
    username: 'alice',
    email: 'alice@example.com',
    tree: [
      {
        name: 'Work',
        files: [['Quarterly budget', 'xlsx']],
        children: [
          {
            name: 'Reports',
            files: [['Annual report 2025', 'pdf'], ['Meeting notes', 'txt']],
            children: [{ name: '2025', files: [['Q4 summary', 'docx']], children: [] }],
          },
          { name: 'Invoices', files: [['Invoice March', 'pdf']], children: [] },
        ],
      },
      {
        name: 'Personal',
        files: [['Reading list', 'txt']],
        children: [
          {
            name: 'Photos',
            files: [['Beach sunset', 'jpg']],
            children: [{ name: 'Vacation', files: [['Mountain view', 'png'], ['Funny moment', 'gif']], children: [] }],
          },
        ],
      },
    ],
  },
  {
    username: 'bob',
    email: 'bob@example.com',
    tree: [
      {
        name: 'Projects',
        files: [['Roadmap', 'docx']],
        children: [
          {
            name: 'Website',
            files: [['Logo', 'webp'], ['Wireframe', 'png']],
            children: [{ name: 'Assets', files: [['Header', 'jpeg']], children: [] }],
          },
        ],
      },
      { name: 'Recipes', files: [['Pancakes', 'txt']], children: [] },
    ],
  },
  {
    username: 'carol',
    email: 'carol@example.com',
    tree: [
      {
        name: 'University',
        files: [['Syllabus', 'pdf']],
        children: [
          {
            name: 'Databases',
            files: [['Normalization notes', 'docx'], ['Exam grades', 'xlsx']],
            children: [{ name: 'Labs', files: [['Lab 1 output', 'txt']], children: [] }],
          },
        ],
      },
    ],
  },
];

async function removePreviousAssets() {
  for (const resourceType of ['image', 'raw']) {
    await cloudinary.api.delete_resources_by_prefix(`${SEED_PREFIX}/`, {
      resource_type: resourceType,
      invalidate: true,
    });
  }
}

function upload(buffer, publicId, resourceType) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { public_id: publicId, resource_type: resourceType, overwrite: true, invalidate: true },
      (error, result) => (error ? reject(error) : resolve(result)),
    );
    stream.end(buffer);
  });
}

async function createFile(user, folderId, [displayName, extension], counter) {
  const type = FILE_TYPES[extension];
  const fixture = path.join(FIXTURES_DIR, `sample.${extension}`);
  const buffer = fs.readFileSync(fixture);
  const base = `${SEED_PREFIX}/${user.username}/${counter}`;
  const publicId = type.resourceType === 'raw' ? `${base}.${extension}` : base;
  const result = await upload(buffer, publicId, type.resourceType);
  return prisma.file.create({
    data: {
      name: `${displayName}.${extension}`,
      extension,
      mimeType: type.mimes[0],
      size: buffer.length,
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: type.resourceType,
      folderId,
      ownerId: user.id,
    },
  });
}

async function createTree(user, parentId, nodes, counter, byName) {
  for (const node of nodes) {
    const folder = await prisma.folder.create({
      data: { name: node.name, ownerId: user.id, parentId },
    });
    byName[node.name] = folder;
    for (const file of node.files) {
      counter.value += 1;
      await createFile(user, folder.id, file, counter.value);
    }
    await createTree(user, folder.id, node.children, counter, byName);
  }
}

async function main() {
  assertConfigured();
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  await removePreviousAssets();
  await prisma.user.deleteMany({ where: { email: { in: USERS.map((u) => u.email) } } });
  await prisma.session.deleteMany();
  await prisma.assetDeletionFailure.deleteMany();

  const created = {};
  for (const definition of USERS) {
    const user = await prisma.user.create({
      data: {
        email: definition.email,
        username: definition.username,
        passwordHash,
        folders: { create: { name: 'My Drive' } },
      },
      include: { folders: true },
    });
    const root = user.folders[0];
    const folders = {};
    await createTree(user, root.id, definition.tree, { value: 0 }, folders);
    created[definition.username] = { user, folders };
  }

  const now = Date.now();
  const { alice, bob } = created;
  await prisma.shareLink.createMany({
    data: [
      {
        token: ACTIVE_TOKEN,
        folderId: alice.folders.Work.id,
        ownerId: alice.user.id,
        durationDays: 7,
        expiresAt: new Date(now + 7 * DAY_MS),
      },
      {
        token: EXPIRED_TOKEN,
        folderId: alice.folders.Personal.id,
        ownerId: alice.user.id,
        durationDays: 1,
        createdAt: new Date(now - 3 * DAY_MS),
        expiresAt: new Date(now - 2 * DAY_MS),
      },
      {
        token: BOB_TOKEN,
        folderId: bob.folders.Projects.id,
        ownerId: bob.user.id,
        durationDays: 30,
        expiresAt: new Date(now + 30 * DAY_MS),
      },
    ],
  });

  const fileCount = await prisma.file.count({ where: { ownerId: { in: Object.values(created).map((c) => c.user.id) } } });
  console.log(`Seeded ${USERS.length} users, ${fileCount} files and 3 share links.`);
  console.log(`Password for all seed users: ${PASSWORD}`);
  console.log(`Active link:  /share/${ACTIVE_TOKEN}`);
  console.log(`Expired link: /share/${EXPIRED_TOKEN}`);
}

main()
  .catch((error) => {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
