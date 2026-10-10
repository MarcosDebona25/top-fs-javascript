const { FILE_TYPES } = require('./file-types');

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Short label for the listing column, for example "Image".
function typeLabel(extension) {
  const type = FILE_TYPES[String(extension).toLowerCase()];
  return type ? type.label : 'File';
}

// Longer label for the file detail, for example "PNG image".
function typeDescription(extension) {
  const type = FILE_TYPES[String(extension).toLowerCase()];
  return type ? type.description : 'File';
}

module.exports = { formatSize, typeLabel, typeDescription };
