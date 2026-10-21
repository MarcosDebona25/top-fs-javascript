require('dotenv/config');
const prisma = require('../src/lib/prisma');
const hitboxes = require('./data/hitboxes.json');

// Natural size of the original images in assets/maps.
const MAPS = [
  { slug: 'beach', name: 'Beach', imageWidth: 2560, imageHeight: 1644 },
  { slug: 'ski-slopes', name: 'Ski Slopes', imageWidth: 2560, imageHeight: 1623 },
  { slug: 'moon-base', name: 'Moon Base', imageWidth: 2560, imageHeight: 1685 },
];

const CHARACTERS = [
  { slug: 'waldo', name: 'Waldo' },
  { slug: 'woof', name: 'Woof' },
  { slug: 'wenda', name: 'Wenda' },
  { slug: 'wizard', name: 'Wizard Whitebeard' },
  { slug: 'odlaw', name: 'Odlaw' },
];

function assertRectangle(map, character, box) {
  const { x, y, width, height } = box || {};
  const valid = [x, y, width, height].every((value) => typeof value === 'number' && value >= 0 && value <= 1);
  if (!valid || width <= 0 || height <= 0 || x + width > 1 || y + height > 1) {
    throw new Error(`Invalid hitbox for ${map}/${character} in prisma/data/hitboxes.json`);
  }
}

async function main() {
  const characterIds = {};
  for (const [index, character] of CHARACTERS.entries()) {
    const row = await prisma.character.upsert({
      where: { slug: character.slug },
      update: { name: character.name, position: index + 1 },
      create: { ...character, position: index + 1 },
    });
    characterIds[character.slug] = row.id;
  }

  let uncalibrated = 0;
  for (const [index, map] of MAPS.entries()) {
    const row = await prisma.map.upsert({
      where: { slug: map.slug },
      update: { name: map.name, imageWidth: map.imageWidth, imageHeight: map.imageHeight, position: index + 1 },
      create: { ...map, position: index + 1 },
    });
    for (const character of CHARACTERS) {
      const box = hitboxes.maps[map.slug] && hitboxes.maps[map.slug][character.slug];
      assertRectangle(map.slug, character.slug, box);
      const data = { x: box.x, y: box.y, width: box.width, height: box.height, calibrated: box.calibrated === true };
      if (!data.calibrated) uncalibrated += 1;
      await prisma.mapCharacter.upsert({
        where: { mapId_characterId: { mapId: row.id, characterId: characterIds[character.slug] } },
        update: data,
        create: { mapId: row.id, characterId: characterIds[character.slug], ...data },
      });
    }
  }

  console.log(`Seeded ${MAPS.length} maps and ${CHARACTERS.length} characters.`);
  if (uncalibrated > 0) {
    console.warn(`WARNING: ${uncalibrated} hitboxes are placeholders (calibrated: false). Draw the real ones with the calibration tool.`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
