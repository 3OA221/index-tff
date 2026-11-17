import { getCollection, type CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'projects'>['data'];
export type Medium = CollectionEntry<'mediums'>['data'];
export type StripItem = CollectionEntry<'strip'>['data'];

/** Site order: newest year first, then project id ascending. Used by the grid and Previous / Next. */
export function compareProjects(a: Project, b: Project): number {
  return b.year - a.year || a.id.localeCompare(b.id);
}

export async function getProjects(): Promise<Project[]> {
  const entries = await getCollection('projects');
  return entries.map((e) => e.data).sort(compareProjects);
}

export async function getMediums(): Promise<Medium[]> {
  return (await getCollection('mediums')).map((e) => e.data);
}

export async function getStripItems(): Promise<StripItem[]> {
  return (await getCollection('strip')).map((e) => e.data);
}

/** Previous and next project in site order; undefined at either end. */
export function neighbours(
  ordered: Project[],
  id: string,
): { prev: Project | undefined; next: Project | undefined } {
  const i = ordered.findIndex((p) => p.id === id);
  return { prev: i > 0 ? ordered[i - 1] : undefined, next: i >= 0 ? ordered[i + 1] : undefined };
}

/** Tab title of a work page: "Authors - Title". */
export function workTitle(p: Project): string {
  return `${p.authors.join(', ')} - ${p.title.cs}`;
}
