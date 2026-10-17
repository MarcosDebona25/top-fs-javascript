import { describe, expect, it } from 'vitest';
import { CONTENT_MAX, TITLE_MAX, saveStatus, validateEssay } from './essay.js';

describe('validateEssay', () => {
  it('accepts a titled essay with content', () => {
    expect(validateEssay({ title: 'A title', content: 'Body' })).toBeNull();
  });

  it('asks for a title and content, ignoring whitespace', () => {
    expect(validateEssay({ title: '   ', content: 'Body' })).toBe('Give the essay a title.');
    expect(validateEssay({ title: 'T', content: '\n\n' })).toBe('Write something before saving.');
  });

  it('enforces the same limits as the API', () => {
    expect(validateEssay({ title: 'x'.repeat(TITLE_MAX + 1), content: 'Body' })).toMatch(/up to 150/);
    expect(validateEssay({ title: 'T', content: 'x'.repeat(CONTENT_MAX + 1) })).toMatch(/up to 50,000/);
    expect(validateEssay({ title: 'x'.repeat(TITLE_MAX), content: 'x'.repeat(CONTENT_MAX) })).toBeNull();
  });
});

describe('saveStatus', () => {
  const timeAgo = () => '2 minutes ago';
  const draft = { published: false, updatedAt: 'x' };

  it('describes a new essay', () => {
    expect(saveStatus({ post: null, dirty: false, timeAgo })).toBe('New essay');
    expect(saveStatus({ post: null, dirty: true, timeAgo })).toBe('Not saved yet · kept on this device');
  });

  it('describes a saved essay and unsaved changes', () => {
    expect(saveStatus({ post: draft, dirty: false, timeAgo })).toBe('Draft · Saved 2 minutes ago');
    expect(saveStatus({ post: { ...draft, published: true }, dirty: true, timeAgo })).toBe(
      'Published · Unsaved changes, kept on this device'
    );
  });
});
