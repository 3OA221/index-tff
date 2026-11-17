import type { Lang } from '../i18n/ui';

/**
 * The one base-path helper. Every internal link and asset path goes through
 * these functions, so `base` in astro.config.mjs is the only place to change it.
 */

/** Prefix a site-relative path with the base: withBase('img/01/a.webp') -> '/index-tff/img/01/a.webp'. */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  const rest = path.replace(/^\/+/, '');
  return `${base}/${rest}`;
}

/**
 * Locale-aware page path. `path` is the language-neutral page path ('/', '/work/01/').
 * Czech is the default at the root, English under /en/.
 *   localePath('cs', '/work/01/') -> '/index-tff/work/01/'
 *   localePath('en', '/')         -> '/index-tff/en/'
 */
export function localePath(lang: Lang, path = '/'): string {
  const [pathname = '/', hash] = path.split('#');
  let clean = `/${pathname.replace(/^\/+/, '')}`;
  if (!clean.endsWith('/')) clean += '/';
  const prefixed = lang === 'en' ? `/en${clean}` : clean;
  return withBase(prefixed) + (hash ? `#${hash}` : '');
}

/** Absolute URL (for hreflang and canonical links). */
export function absoluteUrl(sitePath: string): string {
  return new URL(sitePath, import.meta.env.SITE).href;
}

/** Image path under public/img/. */
export function imgPath(file: string): string {
  return withBase(`img/${file}`);
}

/** Language-neutral path of a project page. */
export function workPath(id: string): string {
  return `/work/${id}/`;
}
