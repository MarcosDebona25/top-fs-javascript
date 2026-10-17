import { API_URL, AUTHOR_URL, READER_URL } from '../playwright.config.mjs';

export { API_URL, AUTHOR_URL, READER_URL };
export const passwords = { author: process.env.AUTHOR_PASSWORD, reader: process.env.READER_PASSWORD };
export const session = (username) => `e2e/.auth/${username}.json`;

// What our frontends send on writes; used when a test talks to the API directly.
export const clientHeaders = (origin) => ({ Origin: origin, 'X-Requested-With': 'blog-client' });
