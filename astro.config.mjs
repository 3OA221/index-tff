import { defineConfig } from 'astro/config';
import UnoCSS from 'unocss/astro';

// `site` and `base` are the only place the hosting path is set.
// For a custom domain later: change `site` and set `base` to '/'.
export default defineConfig({
  site: 'https://3oa221.github.io',
  base: '/index-tff',
  trailingSlash: 'always',
  integrations: [UnoCSS()],
  // i18n routing is added in Stage 2 (Czech default at the root, English under /en/).
});
