const CATEGORY_BY_EXTENSION = {
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  webp: 'image',
  gif: 'image',
  pdf: 'pdf',
  docx: 'document',
  xlsx: 'spreadsheet',
  txt: 'text',
};

function fileCategory(extension) {
  return CATEGORY_BY_EXTENSION[String(extension).toLowerCase()] || 'document';
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

module.exports = { fileCategory, formatSize };
