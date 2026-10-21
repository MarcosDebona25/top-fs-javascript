const { HttpError } = require('../lib/http');
const { validated } = require('../lib/validation');

const SUMMARY_SIZE = 10;
const DEFAULT_PAGE_SIZE = 10;

function createLeaderboardsController({ prisma, leaderboards, events }) {
  function paging(req) {
    const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = validated(req);
    return { page, pageSize, limit: pageSize, offset: (page - 1) * pageSize };
  }

  const envelope = ({ page, pageSize }, { rows, total }) => ({
    rows,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });

  async function summary(req, res) {
    res.json(await leaderboards.summary(SUMMARY_SIZE));
  }

  async function global(req, res) {
    const options = paging(req);
    res.json(envelope(options, await leaderboards.globalPage(options)));
  }

  async function forMap(req, res) {
    const map = await prisma.map.findUnique({ where: { slug: req.params.slug } });
    if (!map) throw new HttpError(404, 'Map not found');
    const options = paging(req);
    res.json({ map: { slug: map.slug, name: map.name }, ...envelope(options, await leaderboards.mapPage(map.id, options)) });
  }

  function stream(req, res) {
    events.subscribe(req, res);
  }

  return { summary, global, forMap, stream };
}

module.exports = createLeaderboardsController;
