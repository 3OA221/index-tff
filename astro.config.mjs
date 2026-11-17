import { defineConfig } from 'astro/config';
import UnoCSS from 'unocss/astro';

// `site` and `base` are the only place the hosting path is set.
// For a custom domain later: change `site` and set `base` to '/'.
export default defineConfig({
  site: 'https://3oa221.github.io',
  base: '/index-tff',
  trailingSlash: 'always',
  integrations: [UnoCSS()],
  // Czech is the default language at the root, English under /en/.
  i18n: {
    locales: ['cs', 'en'],
    defaultLocale: 'cs',
    routing: { prefixDefaultLocale: false },
  },
});
