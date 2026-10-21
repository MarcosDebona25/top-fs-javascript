const MAP_CACHE = 'public, max-age=60, stale-while-revalidate=300';

function createMapsController({ maps }) {
  async function list(req, res) {
    res.set('Cache-Control', MAP_CACHE).json({ maps: await maps.list() });
  }

  async function show(req, res) {
    res.set('Cache-Control', MAP_CACHE).json({ map: await maps.show(req.params.slug) });
  }

  return { list, show };
}

module.exports = createMapsController;
