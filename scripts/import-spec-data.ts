/**
 * Writes the site data from the rebuild specification (opus-rebuild-prompt.md)
 * into src/content/. Run once, or again whenever the specification's data changes:
 *
 *   node scripts/import-spec-data.ts path/to/opus-rebuild-prompt.md
 *
 * - Section 9 facets  -> src/content/facets.json        (shape {"medium": [...]})
 * - Section 9 projects -> src/content/projects/NN.json  (one file per project)
 * - Section 8 strip    -> src/content/strip.json        ([{id, cs, en}])
 *
 * Values are copied with JSON.parse / JSON.stringify only, so the text stays exact.
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const specPath = process.argv[2];
if (!specPath) {
  console.error('Usage: node scripts/import-spec-data.ts <path to opus-rebuild-prompt.md>');
  process.exit(1);
}
const spec = readFileSync(specPath, 'utf8');

/** The first ```json block after the given marker line. */
function jsonBlockAfter(marker: string): unknown {
  const at = spec.indexOf(marker);
  if (at < 0) throw new Error(`Marker not found: ${marker}`);
  const open = spec.indexOf('```json\n', at);
  const close = spec.indexOf('\n```', open + 8);
  if (open < 0 || close < 0) throw new Error(`No json block after: ${marker}`);
  return JSON.parse(spec.slice(open + 8, close));
}

const facets = jsonBlockAfter('Facets (mediums') as { medium: unknown[] };
const projects = jsonBlockAfter('Projects (one per line)') as Array<{ id: string }>;

const stripLine = spec.split('\n').find((l) => l.startsWith('- Strip items:'));
if (!stripLine) throw new Error('Strip items line not found');
const strip = [...stripLine.matchAll(/\((\d+)\) "([^"]+)" \/ "([^"]+)"/g)].map((m) => ({
  id: m[1],
  cs: m[2],
  en: m[3],
}));

const contentDir = join(process.cwd(), 'src', 'content');
const projectDir = join(contentDir, 'projects');
mkdirSync(projectDir, { recursive: true });
for (const f of readdirSync(projectDir)) {
  if (f.endsWith('.json')) rmSync(join(projectDir, f));
}

const write = (path: string, data: unknown) =>
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');

write(join(contentDir, 'facets.json'), facets);
write(join(contentDir, 'strip.json'), strip);
for (const p of projects) write(join(projectDir, `${p.id}.json`), p);

console.log(
  `Wrote ${projects.length} projects, ${facets.medium.length} mediums, ${strip.length} strip items.`,
);
