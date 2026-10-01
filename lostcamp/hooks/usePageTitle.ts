import { useEffect } from 'react';

export function usePageTitle(title?: string) {
  useEffect(() => {
    const defaultTitle = 'LOST CAMP';
    document.title = title ? `${title} — LOST CAMP` : defaultTitle;

    return () => {
      document.title = defaultTitle;
    };
  }, [title]);
}
