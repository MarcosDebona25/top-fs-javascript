// "ski-slopes" -> "skiSlopes": map slugs become keys of the global leaderboard's times.
function camelCase(slug) {
  return slug.replace(/-([a-z0-9])/g, (match, char) => char.toUpperCase());
}

module.exports = { camelCase };
