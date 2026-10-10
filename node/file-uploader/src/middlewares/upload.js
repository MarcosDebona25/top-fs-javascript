const multer = require('multer');
const { FILE_TYPES, MAX_FILE_SIZE, ALLOWED_LABEL, splitFileName } = require('../lib/file-types');

const REJECTED_TYPE = `This file type is not allowed. Allowed types: ${ALLOWED_LABEL}. Compressed files (zip, rar, 7z, tar, gz) are not accepted. Select the file again.`;

// Multipart file names arrive decoded as latin1; recover the UTF-8 original when possible.
function fixFileNameEncoding(name) {
  const decoded = Buffer.from(name, 'latin1').toString('utf8');
  return decoded.includes('\uFFFD') ? name : decoded;
}

function fileFilter(req, file, cb) {
  file.originalname = fixFileNameEncoding(file.originalname);
  const { extension } = splitFileName(file.originalname);
  const type = FILE_TYPES[extension];
  if (!type) {
    req.uploadError = REJECTED_TYPE;
    return cb(null, false);
  }
  if (!type.mimes.includes(file.mimetype)) {
    req.uploadError = `The file content type doesn't match the .${extension} extension. Select the file again.`;
    return cb(null, false);
  }
  return cb(null, true);
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1, fields: 5, parts: 10 },
  fileFilter,
}).single('file');

const MULTER_MESSAGES = {
  LIMIT_FILE_SIZE: 'File is too large (max 10 MB). Select a smaller file.',
  LIMIT_UNEXPECTED_FILE: 'Upload one file at a time. Select the file again.',
  LIMIT_FILE_COUNT: 'Upload one file at a time. Select the file again.',
};

// Runs multer and turns any of its errors into req.uploadError, so they never become a 500.
function handleUpload(req, res, next) {
  upload(req, res, (error) => {
    if (error) {
      req.uploadError = MULTER_MESSAGES[error.code] || 'The upload could not be processed. Select the file again.';
    }
    next();
  });
}

module.exports = { handleUpload };
