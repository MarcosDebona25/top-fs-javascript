const { HttpError } = require('../lib/http');

// Characters are listed without coordinates: the rectangles never leave the server.
const WITH_CHARACTERS = {
  characters: { include: { character: true }, orderBy: { character: { position: 'asc' } } },
};

function createMaps({ prisma, leaderboards }) {
  const presentCharacters = (map) => map.characters.map(({ character }) => ({ slug: character.slug, name: character.name }));

  function present(map, bestTimeMs = null) {
    return {
      slug: map.slug,
      name: map.name,
      imageWidth: map.imageWidth,
      imageHeight: map.imageHeight,
      // False while any character still has a placeholder rectangle (see prisma/data/hitboxes.json).
      calibrated: map.characters.every((entry) => entry.calibrated),
      characters: presentCharacters(map),
      bestTimeMs,
    };
  }

  async function list() {
    const [maps, best] = await Promise.all([
      prisma.map.findMany({ orderBy: { position: 'asc' }, include: WITH_CHARACTERS }),
      leaderboards.bestTimes(),
    ]);
    return maps.map((map) => present(map, best[map.id] ?? null));
  }

  async function findBySlug(slug) {
    const map = await prisma.map.findUnique({ where: { slug }, include: WITH_CHARACTERS });
    if (!map) throw new HttpError(404, 'Map not found');
    return map;
  }

  // One scene is all the play page needs, so it does not download the other maps and their characters.
  async function show(slug) {
    return present(await findBySlug(slug));
  }

  return { list, show, findBySlug, presentCharacters };
}

module.exports = createMaps;
