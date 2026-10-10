import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Chaque étude de cas suit la même trame : contexte → rôle → process → résultat.
const projets = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projets' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    client: z.string(),
    year: z.number().optional(),
    role: z.string().optional(),
    stack: z.array(z.string()),
    order: z.number(),
    featured: z.boolean().default(true),
    draft: z.boolean().default(false),
  }),
});

export const collections = { projets };
