import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const localized = z.object({ cs: z.string().min(1), en: z.string().min(1) }).strict();

const person = z
  .object({
    name: z.string().min(1),
    role: localized.nullable(),
  })
  .strict();

const imagePath = z.string().regex(/^\d{2}\/[^/]+\.webp$/, 'path relative to public/img/');

const image = z
  .object({
    src: imagePath,
    thumb: imagePath,
    w: z.number().int().positive(),
    h: z.number().int().positive(),
    tw: z.number().int().positive(),
    alt: localized,
  })
  .strict();

const projects = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/projects' }),
  schema: z
    .object({
      id: z.string().regex(/^\d{2}$/),
      title: localized,
      authors: z.array(z.string().min(1)).min(1),
      collaborators: z.array(person),
      credits: z.array(person),
      year: z.number().int().min(2000).max(2100),
      study: z.number().int().min(1).max(4),
      mediums: z.array(z.string().min(1)).min(1),
      format: localized,
      duration: z.string().min(1).nullable(),
      description: z
        .object({
          lang: z.enum(['cs', 'sk']),
          original: z.string().min(1),
          en: z.string().min(1),
        })
        .strict(),
      socials: z.array(z.object({ label: z.string().min(1), url: z.url() }).strict()),
      links: z.array(z.object({ label: localized, url: z.url() }).strict()),
      media: z
        .object({
          images: z.array(image),
          cover: z
            .object({
              src: imagePath,
              thumb: imagePath,
              w: z.number().int().positive(),
              h: z.number().int().positive(),
            })
            .strict(),
          preview: imagePath.optional(),
          hasVideo: z.boolean(),
          videoEmbed: z.array(z.string().regex(/^[\w-]{11}$/, 'YouTube video ID')),
        })
        .strict(),
    })
    .strict(),
});

const mediums = defineCollection({
  loader: file('src/content/facets.json', {
    parser: (text) => (JSON.parse(text) as { medium: Array<Record<string, unknown>> }).medium,
  }),
  schema: z
    .object({ id: z.string().min(1), cs: z.string().min(1), en: z.string().min(1) })
    .strict(),
});

const strip = defineCollection({
  loader: file('src/content/strip.json'),
  schema: z
    .object({ id: z.string().min(1), cs: z.string().min(1), en: z.string().min(1) })
    .strict(),
});

export const collections = { projects, mediums, strip };
