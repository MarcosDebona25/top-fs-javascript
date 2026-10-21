function createMapsController({ maps }) {
  async function list(req, res) {
    res.json({ maps: await maps.list() });
  }

  return { list };
}

module.exports = createMapsController;
