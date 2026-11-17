/**
 * Prefix a site-relative path with the configured base (`base` in astro.config.mjs).
 * Every internal link and asset path goes through this helper.
 *
 *   withBase('/')            -> '/index-tff/'
 *   withBase('img/01/a.webp') -> '/index-tff/img/01/a.webp'
 */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  const rest = path.replace(/^\/+/, '');
  return `${base}/${rest}`;
}
