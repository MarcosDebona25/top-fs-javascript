const OOXML_WORD = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const OOXML_SHEET = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Extension (lowercase) is the primary criterion; the MIME must be one of the accepted values.
const FILE_TYPES = {
  png: { mimes: ['image/png'], resourceType: 'image', label: 'Image', description: 'PNG image' },
  jpg: { mimes: ['image/jpeg'], resourceType: 'image', label: 'Image', description: 'JPEG image' },
  jpeg: { mimes: ['image/jpeg'], resourceType: 'image', label: 'Image', description: 'JPEG image' },
  webp: { mimes: ['image/webp'], resourceType: 'image', label: 'Image', description: 'WebP image' },
  gif: { mimes: ['image/gif'], resourceType: 'image', label: 'Image', description: 'GIF image' },
  pdf: { mimes: ['application/pdf'], resourceType: 'image', label: 'PDF', description: 'PDF document' },
  txt: { mimes: ['text/plain'], resourceType: 'raw', label: 'Text', description: 'Plain text' },
  docx: {
    mimes: [OOXML_WORD, 'application/octet-stream'],
    resourceType: 'raw',
    label: 'Document',
    description: 'Word document',
  },
  xlsx: {
    mimes: [OOXML_SHEET, 'application/octet-stream'],
    resourceType: 'raw',
    label: 'Spreadsheet',
    description: 'Excel spreadsheet',
  },
};

const MAX_FILE_SIZE = 10485760;
const MAX_BASE_NAME_LENGTH = 200;
const ALLOWED_EXTENSIONS = Object.keys(FILE_TYPES);
const ALLOWED_LABEL = 'PNG, JPG, JPEG, WEBP, GIF, PDF, TXT, DOCX, XLSX';

function splitFileName(fileName) {
  const dot = fileName.lastIndexOf('.');
  if (dot <= 0) return { base: fileName, extension: '' };
  return { base: fileName.slice(0, dot), extension: fileName.slice(dot + 1).toLowerCase() };
}

module.exports = {
  FILE_TYPES,
  MAX_FILE_SIZE,
  MAX_BASE_NAME_LENGTH,
  ALLOWED_EXTENSIONS,
  ALLOWED_LABEL,
  splitFileName,
};
