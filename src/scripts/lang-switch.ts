import { LANG_STORAGE_KEY, LANGS, type Lang } from '../i18n/ui';

function isLang(value: string | undefined): value is Lang {
  return (LANGS as readonly string[]).includes(value ?? '');
}

/** Remember the language chosen with the switch (used by the root page redirect). */
for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-lang-link]')) {
  link.addEventListener('click', () => {
    const lang = link.dataset.langLink;
    if (!isLang(lang)) return;
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // Storage unavailable (private mode, blocked): the link still works.
    }
  });
}
