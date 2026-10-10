// Flux RSS du blog, généré au build (pas de dépendance supplémentaire)
import type { APIContext } from 'astro';
import { CATEGORIES, getPosts } from '../../data/blog';
import { site } from '../../data/site';

const escape = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export async function GET(context: APIContext) {
	const base = context.site ?? new URL('https://example.com');
	const posts = await getPosts();
	const items = posts
		.map((post) => {
			const url = new URL(`/blog/${post.id}`, base).href;
			return `
		<item>
			<title>${escape(post.data.title)}</title>
			<link>${url}</link>
			<guid>${url}</guid>
			<description>${escape(post.data.description)}</description>
			<category>${escape(CATEGORIES[post.data.category].single)}</category>
			<pubDate>${post.data.pubDate.toUTCString()}</pubDate>
		</item>`;
		})
		.join('');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
	<channel>
		<title>${escape(`Blog — ${site.name}`)}</title>
		<link>${new URL('/blog', base).href}</link>
		<description>Mes créations, ma veille techno et quelques billets hors écran.</description>
		<language>fr-fr</language>${items}
	</channel>
</rss>
`;
	return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
