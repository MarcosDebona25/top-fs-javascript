// Dictionary of listing icons: one entry per file type the app handles, plus "folder".
// Each value is the inner markup of a 24x24 SVG drawn with currentColor (see views/partials/icon.ejs).
const PAGE = '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>';

const FOLDER =
  '<path d="M2 5.5A1.5 1.5 0 0 1 3.5 4H9l2 2.5h9.5A1.5 1.5 0 0 1 22 8v10.5a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 18.5z" fill="currentColor" stroke="none"/>';
const IMAGE =
  '<rect x="3" y="5" width="18" height="14" rx="1.5"/><circle cx="8.5" cy="10" r="1.5"/><path d="m3.5 17.5 5-5 4 4 3-3 5 5"/>';
const PDF = `${PAGE}<path d="M6 15h12v6H6z" fill="currentColor"/>`;
const TEXT = `${PAGE}<path d="M9 12h6M9 15h6M9 18h4"/>`;
const DOCUMENT = `${PAGE}<path d="M9 11h6v3H9z"/><path d="M9 17.5h6"/>`;
const SPREADSHEET =
  '<rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><path d="M3.5 9.5h17M3.5 14.5h17M9.5 4.5v15"/>';

const FILE_ICONS = {
  folder: FOLDER,
  png: IMAGE,
  jpg: IMAGE,
  jpeg: IMAGE,
  webp: IMAGE,
  gif: IMAGE,
  pdf: PDF,
  txt: TEXT,
  docx: DOCUMENT,
  xlsx: SPREADSHEET,
};

// Unknown types fall back to a blank page.
function fileIcon(type) {
  return FILE_ICONS[String(type).toLowerCase()] || PAGE;
}

module.exports = { FILE_ICONS, fileIcon };
