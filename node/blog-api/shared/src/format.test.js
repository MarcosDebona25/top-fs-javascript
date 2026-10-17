import { describe, expect, it } from 'vitest';
import { formatDate, notesLabel, plural, readersLabel, readingMinutes, timeAgo } from './format.js';

const note = (authorId) => ({ author: { id: authorId } });

describe('formatDate', () => {
  it('writes the long and short forms', () => {
    expect(formatDate('2026-10-16T12:00:00Z')).toBe('October 16, 2026');
    expect(formatDate('2026-10-16T12:00:00Z', 'short')).toBe('Oct 16, 2026');
  });
});

describe('readingMinutes', () => {
  it('rounds up at 230 words per minute', () => {
    expect(readingMinutes(Array(230).fill('word').join(' '))).toBe(1);
    expect(readingMinutes(Array(231).fill('word').join(' '))).toBe(2);
  });

  it('never says zero minutes', () => {
    expect(readingMinutes('   ')).toBe(1);
  });
});

describe('plural and notesLabel', () => {
  it('picks the singular only for one', () => {
    expect(plural(1, 'note')).toBe('1 note');
    expect(plural(0, 'note')).toBe('0 notes');
    expect(plural(2, 'reply', 'replies')).toBe('2 replies');
  });

  it('says "No notes yet" instead of zero', () => {
    expect(notesLabel(0)).toBe('No notes yet');
    expect(notesLabel(3)).toBe('3 notes');
  });
});

describe('readersLabel', () => {
  it('counts people, not notes', () => {
    expect(readersLabel([note(1), note(1), note(2)])).toBe('Two readers wrote back');
    expect(readersLabel([note(7)])).toBe('One reader wrote back');
  });

  it('falls back to digits past ten and handles no notes', () => {
    const many = Array.from({ length: 12 }, (_, i) => note(i));
    expect(readersLabel(many)).toBe('12 readers wrote back');
    expect(readersLabel([])).toBe('No notes yet');
  });
});

describe('timeAgo', () => {
  const now = Date.parse('2026-10-17T12:00:00Z');
  const ago = (seconds) => new Date(now - seconds * 1000).toISOString();

  it('says "just now" under 45 seconds', () => {
    expect(timeAgo(ago(10), now)).toBe('just now');
  });

  it('uses minutes, hours and days', () => {
    expect(timeAgo(ago(120), now)).toBe('2 minutes ago');
    expect(timeAgo(ago(3 * 3600), now)).toBe('3 hours ago');
    expect(timeAgo(ago(86400), now)).toBe('yesterday');
  });

  it('shows the date after a week', () => {
    expect(timeAgo(ago(8 * 86400), now)).toBe('Oct 9, 2026');
  });
});
