export const LANGS = ['cs', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'cs';

/** Interface strings used by the layout. Content strings come in later stages. */
export const ui = {
  cs: {
    skip: 'Přeskočit na obsah',
  },
  en: {
    skip: 'Skip to content',
  },
} as const satisfies Record<Lang, Record<string, string>>;
