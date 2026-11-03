// Plan du site, généré au build (même principe que le flux RSS : pas de dépendance supplémentaire)
import type { APIContext } from 'astro';
import { getPosts } from '../data/blog';

export async function GET(context: APIContext) {
	const base = context.site ?? new URL('https://maxiko.fr');
	const posts = await getPosts();
	const urls = [
		{ path: '/' },
		{ path: '/services' },
		{ path: '/blog' },
		...posts.map((post) => ({ path: `/blog/${post.id}`, lastmod: post.data.pubDate })),
	];
	const body = urls
		.map(({ path, lastmod }) => {
			const loc = new URL(path, base).href;
			return `
	<url>
		<loc>${loc}</loc>${lastmod ? `\n		<lastmod>${lastmod.toISOString().slice(0, 10)}</lastmod>` : ''}
	</url>`;
		})
		.join('');

	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}
</urlset>
`,
		{ headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
	);
}
