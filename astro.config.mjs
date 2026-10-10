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
  integrations: [
    icon(),
    (await import("astro-compress")).default({
      Image: true, // active la compression des images
    }),
  ]
});
