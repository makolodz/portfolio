import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Une étude de cas = 4 parties courtes, pour que la page /projets tienne dans un écran.
const PART_MAX = 260;
const part = z
	.string()
	.max(PART_MAX, `Trop long pour tenir sans scroller sur /projets (${PART_MAX} caractères max, soit 2-3 phrases).`)
	.optional();

const projets = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/projets' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			summary: z.string(),
			client: z.string(),
			year: z.number().optional(),
			stack: z.array(z.string()),
			order: z.number(),
			/** Affiché sur l'accueil (les autres restent visibles sur /projets) */
			featured: z.boolean().default(true),
			draft: z.boolean().default(false),

			// Visuel : capture d'écran (cover = recadrée) ou affiche (contain = entière)
			cover: image().optional(),
			coverAlt: z.string().optional(),
			coverFit: z.enum(['cover', 'contain']).default('cover'),
			coverFocus: z.string().default('center top'),

			links: z.array(z.object({ label: z.string(), href: z.string().url() })).default([]),
			/** Article du blog qui raconte le projet (lien croisé dans les deux sens) */
			article: reference('blog').optional(),

			// Étude de cas — vide = affiché « à compléter »
			contexte: part,
			role: part,
			process: part,
			resultat: part,
		}),
});

// Articles du blog : créations, veille techno et billets perso
const blog = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			category: z.enum(['creation', 'veille', 'perso']),
			tags: z.array(z.string()).default([]),
			cover: image(),
			coverAlt: z.string(),
			// cover = image recadrée ; contain = logo ou affiche, affichés en entier
			coverFit: z.enum(['cover', 'contain']).default('cover'),
			draft: z.boolean().default(false),
		}),
});

export const collections = { projets, blog };
