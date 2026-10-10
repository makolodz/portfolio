// Outils communs au blog : catégories, temps de lecture, dates.
import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

export const CATEGORIES = {
	creation: { label: 'Créations', single: 'Création' },
	veille: { label: 'Veille', single: 'Veille' },
	perso: { label: 'Perso', single: 'Perso' },
} as const;

export type Category = keyof typeof CATEGORIES;

/** Articles publiés, du plus récent au plus ancien */
export async function getPosts() {
	const posts = await getCollection('blog', ({ data }) => !data.draft);
	return posts.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime() || a.data.title.localeCompare(b.data.title));
}

/** Temps de lecture estimé (200 mots par minute) */
export const readingTime = (post: Post) => Math.max(1, Math.round((post.body ?? '').split(/\s+/).filter(Boolean).length / 200));

export const formatDate = (date: Date) => date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
