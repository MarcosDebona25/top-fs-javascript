import { useEffect } from 'react';

// "Essay title · Marginalia"; the site name alone when there is no page title.
export function useDocumentTitle(title, site = 'Marginalia') {
  useEffect(() => {
    document.title = title ? `${title} · ${site}` : site;
  }, [title, site]);
}
