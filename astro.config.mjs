// @ts-check
import { defineConfig } from "astro/config";

import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  output: 'static',
  // TODO: remplacer par le domaine définitif (utilisé pour les URLs canoniques / OG)
  site: 'https://maxiko.fr',
  build: {
    inlineStylesheets: 'always',
  },
  // Anciennes adresses des articles → blog (les liens déjà partagés continuent de marcher)
  redirects: {
    '/blogs/kayak': '/blog/kayak',
    '/blogs/lecture': '/blog/lecture',
    '/creations/portfolio': '/blog/portfolio',
    '/creations/realite-augmentee': '/blog/realite-augmentee',
    '/creations/webweek': '/blog/webweek',
    '/veille/jamstack': '/blog/jamstack',
    '/veille/tauri': '/blog/tauri',
    '/notes': '/blog',
  },
  integrations: [
    icon(),
    (await import("astro-compress")).default({
      Image: true, // active la compression des images
    }),
  ]
});
