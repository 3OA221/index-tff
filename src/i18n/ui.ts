export const LANGS = ['cs', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'cs';

/** localStorage key for the language the visitor chose with the switch. */
export const LANG_STORAGE_KEY = 'tff-lang';

/** Interface strings (spec section 8). Content strings come from src/content/. */
export const ui = {
  cs: {
    skip: 'Přeskočit na obsah',
    language: 'Jazyk',
    langName: 'Čeština',
    langShort: 'CZ',
    projects: 'Projekty',
    back: '← Zpět',
    previous: '← Předchozí',
    next: 'Další →',
    previousLabel: 'Předchozí',
    nextLabel: 'Další',
    projectNotFound: 'Projekt nebyl nalezen.',
  },
  en: {
    skip: 'Skip to content',
    language: 'Language',
    langName: 'English',
    langShort: 'EN',
    projects: 'Projects',
    back: '← Back',
    previous: '← Previous',
    next: 'Next →',
    previousLabel: 'Previous',
    nextLabel: 'Next',
    projectNotFound: 'Project not found.',
  },
} as const satisfies Record<Lang, Record<string, string>>;
