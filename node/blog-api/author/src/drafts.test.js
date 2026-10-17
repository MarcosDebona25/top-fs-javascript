import { describe, expect, it, vi } from 'vitest';
import { clearDraft, loadDraft, saveDraft } from './drafts.js';

describe('drafts', () => {
  it('keeps one draft per essay and one for a new essay', () => {
    saveDraft(4, { title: 'Four', content: 'a' });
    saveDraft(null, { title: 'New', content: 'b' });

    expect(loadDraft(4)).toMatchObject({ title: 'Four', content: 'a' });
    expect(loadDraft(null)).toMatchObject({ title: 'New', content: 'b' });
    expect(localStorage.getItem('marginalia:draft:new')).not.toBeNull();
  });

  it('forgets a draft once cleared', () => {
    saveDraft(4, { title: 'Four', content: 'a' });
    clearDraft(4);
    expect(loadDraft(4)).toBeNull();
  });

  it('returns null for a corrupt entry', () => {
    localStorage.setItem('marginalia:draft:9', '{not json');
    expect(loadDraft(9)).toBeNull();
  });

  it('keeps working when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });
    expect(() => saveDraft(1, { title: 'T', content: 'c' })).not.toThrow();
  });
});
