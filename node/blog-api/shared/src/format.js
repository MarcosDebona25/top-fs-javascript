const WORDS_PER_MINUTE = 230;

const longDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' });
const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export function formatDate(iso, style = 'long') {
  return (style === 'short' ? shortDate : longDate).format(new Date(iso));
}

export function readingMinutes(markdown) {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

export function plural(count, one, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

const NUMBER_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

export function notesLabel(count) {
  return count === 0 ? 'No notes yet' : plural(count, 'note');
}

// "Three readers wrote back": counts people, not notes.
export function readersLabel(notes) {
  const readers = new Set(notes.map((note) => note.author.id)).size;
  if (readers === 0) return 'No notes yet';
  const word = NUMBER_WORDS[readers] ?? String(readers);
  return `${word} ${readers === 1 ? 'reader' : 'readers'} wrote back`;
}

const relative = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });
const UNITS = [
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
];

// "2 minutes ago", "yesterday"; older than a week falls back to the date.
export function timeAgo(iso, now = Date.now()) {
  const seconds = Math.round((new Date(iso) - now) / 1000);
  if (Math.abs(seconds) < 45) return 'just now';
  if (Math.abs(seconds) > 7 * 86400) return formatDate(iso, 'short');
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return relative.format(Math.round(seconds / 60), 'minute');
}
