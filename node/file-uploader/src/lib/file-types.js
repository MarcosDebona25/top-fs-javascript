const OOXML_WORD = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const OOXML_SHEET = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Extension (lowercase) is the primary criterion; the MIME must be one of the accepted values.
const FILE_TYPES = {
  png: { mimes: ['image/png'], resourceType: 'image' },
  jpg: { mimes: ['image/jpeg'], resourceType: 'image' },
  jpeg: { mimes: ['image/jpeg'], resourceType: 'image' },
  webp: { mimes: ['image/webp'], resourceType: 'image' },
  gif: { mimes: ['image/gif'], resourceType: 'image' },
  pdf: { mimes: ['application/pdf'], resourceType: 'image' },
  txt: { mimes: ['text/plain'], resourceType: 'raw' },
  docx: { mimes: [OOXML_WORD, 'application/octet-stream'], resourceType: 'raw' },
  xlsx: { mimes: [OOXML_SHEET, 'application/octet-stream'], resourceType: 'raw' },
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
