// Unsaved editor text, kept on this device until the API confirms a save.
// Not a secret, but it can hold an unpublished essay: it is cleared after every successful save.
const key = (essayId) => `marginalia:draft:${essayId ?? 'new'}`;

export function loadDraft(essayId) {
  try {
    return JSON.parse(localStorage.getItem(key(essayId)));
  } catch {
    return null;
  }
}

export function saveDraft(essayId, { title, content }) {
  try {
    localStorage.setItem(key(essayId), JSON.stringify({ title, content, savedAt: new Date().toISOString() }));
  } catch {
    // Storage full or blocked: the editor still works, it just cannot keep a local copy.
  }
}

export function clearDraft(essayId) {
  try {
    localStorage.removeItem(key(essayId));
  } catch {
    // Same as above.
  }
}
