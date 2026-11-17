/**
 * Data integrity checks. Runs before `astro build` and fails the build on:
 * - a project count other than EXPECTED_PROJECTS
 * - a duplicated project id, or an id that does not match its file name
 * - a medium id that is not in src/content/facets.json
 * - a referenced image (src, thumb, cover, preview) missing under public/img/
 * Field shapes are validated separately by the schema in src/content.config.ts.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const EXPECTED_PROJECTS = 19;

interface Img {
  src: string;
  thumb: string;
}
interface Project {
  id: string;
  mediums: string[];
  media: { images: Img[]; cover: Img; preview?: string };
}

const root = process.cwd();
const projectDir = join(root, 'src', 'content', 'projects');
const imgDir = join(root, 'public', 'img');
const errors: string[] = [];

const facets = JSON.parse(readFileSync(join(root, 'src', 'content', 'facets.json'), 'utf8')) as {
  medium: Array<{ id: string }>;
};
const mediumIds = new Set(facets.medium.map((m) => m.id));
if (mediumIds.size !== facets.medium.length) errors.push('facets.json: duplicated medium id');

const files = readdirSync(projectDir)
  .filter((f) => f.endsWith('.json'))
  .sort();
const seen = new Map<string, string>();
let imageRefs = 0;

for (const file of files) {
  const p = JSON.parse(readFileSync(join(projectDir, file), 'utf8')) as Project;
  const where = `projects/${file}`;

  if (seen.has(p.id)) errors.push(`${where}: id ${p.id} duplicates ${seen.get(p.id)}`);
  seen.set(p.id, where);
  if (`${p.id}.json` !== file) errors.push(`${where}: id ${p.id} does not match the file name`);

  for (const m of p.mediums) {
    if (!mediumIds.has(m)) errors.push(`${where}: medium "${m}" is not in facets.json`);
  }

  const refs = [
    ...p.media.images.flatMap((i) => [i.src, i.thumb]),
    p.media.cover.src,
    p.media.cover.thumb,
    ...(p.media.preview ? [p.media.preview] : []),
  ];
  for (const ref of refs) {
    imageRefs++;
    if (!existsSync(join(imgDir, ref))) errors.push(`${where}: missing image public/img/${ref}`);
  }
}

if (files.length !== EXPECTED_PROJECTS) {
  errors.push(`expected ${EXPECTED_PROJECTS} projects, found ${files.length}`);
}

if (errors.length) {
  console.error(`Data check failed (${errors.length}):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(
  `Data check passed: ${files.length} projects, ${mediumIds.size} mediums, ${imageRefs} image references.`,
);
