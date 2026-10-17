const READER_URL = import.meta.env.VITE_READER_URL;

// Links from the desk to the public site, which runs on its own origin.
export function readerUrl(path = '/') {
  return `${READER_URL}${path}`;
}
