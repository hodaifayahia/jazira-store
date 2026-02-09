import { useEffect } from 'react';

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title;
    return () => { document.title = 'DZ Store - متجرك الإلكتروني في الجزائر'; };
  }, [title]);
}
