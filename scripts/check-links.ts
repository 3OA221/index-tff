/**
 * Link check on the built site (dist/). Runs after `astro build`.
 * Checks every internal href, src and srcset in every HTML page:
 * - it starts with the base path (/index-tff/) or the site URL with the base
 * - the target file exists in dist/ (a path ending in / means its index.html)
 * - a #fragment exists as an id in the target page
 * Also checks that every project has a Czech and an English page.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SITE = 'https://3oa221.github.io';
const BASE = '/index-tff/';

const root = process.cwd();
const dist = join(root, 'dist');
const errors: string[] = [];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const pages = walk(dist).filter((p) => p.endsWith('.html'));
const idCache = new Map<string, Set<string>>();
function idsOf(file: string): Set<string> {
  let ids = idCache.get(file);
  if (!ids) {
    const html = readFileSync(file, 'utf8');
    ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1] ?? ''));
    idCache.set(file, ids);
  }
  return ids;
}

function decode(s: string): string {
  return s.replace(/&amp;/g, '&').replace(/&#x2F;/gi, '/');
}

let checked = 0;
for (const page of pages) {
  const rel = relative(dist, page);
  const html = readFileSync(page, 'utf8');
  const refs: string[] = [];
  for (const m of html.matchAll(/\s(?:href|src)="([^"]*)"/g)) refs.push(decode(m[1] ?? ''));
  for (const m of html.matchAll(/\ssrcset="([^"]*)"/g)) {
    for (const part of decode(m[1] ?? '').split(',')) {
      const url = part.trim().split(/\s+/)[0];
      if (url) refs.push(url);
    }
  }

  for (let ref of refs) {
    if (/^(mailto:|tel:|javascript:)/.test(ref)) continue;
    if (ref.startsWith(SITE)) ref = ref.slice(SITE.length);
    else if (/^[a-z]+:\/\//i.test(ref) || ref.startsWith('//')) continue; // external

    checked++;
    if (ref.startsWith('#')) {
      const id = ref.slice(1);
      if (id && !idsOf(page).has(id)) errors.push(`${rel}: missing fragment ${ref}`);
      continue;
    }
    if (!ref.startsWith(BASE)) {
      errors.push(`${rel}: link without base path: ${ref}`);
      continue;
    }
    const [pathPart = '', fragment] = ref.split('#');
    let target = decodeURIComponent(pathPart.split('?')[0] ?? '').slice(BASE.length);
    if (target === '' || target.endsWith('/')) target += 'index.html';
    const file = join(dist, target);
    if (!existsSync(file)) {
      errors.push(`${rel}: broken link ${ref}`);
    } else if (fragment && file.endsWith('.html') && !idsOf(file).has(fragment)) {
      errors.push(`${rel}: missing fragment ${ref}`);
    }
  }
}

const ids = readdirSync(join(root, 'src', 'content', 'projects'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.slice(0, -5));
let projectPages = 0;
for (const id of ids) {
  for (const prefix of ['', 'en/']) {
    const p = join(dist, `${prefix}work/${id}/index.html`);
    if (existsSync(p)) projectPages++;
    else errors.push(`missing project page /${prefix}work/${id}/`);
  }
}

if (errors.length) {
  console.error(`Link check failed (${errors.length}):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(
  `Link check passed: ${pages.length} pages, ${checked} internal links, ${projectPages} project pages.`,
);
