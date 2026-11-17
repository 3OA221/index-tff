// Vite+ (`vp check`) settings only. Astro does not read this file;
// the site is built with `astro build` (npm run build).
import { defineConfig } from 'vite-plus';

export default defineConfig({
  fmt: {
    ignorePatterns: [
      'dist/**',
      '.astro/**',
      'node_modules/**',
      'public/**',
      'package-lock.json',
      'README.md',
    ],
    singleQuote: true,
  },
  lint: {
    ignorePatterns: ['dist/**', '.astro/**', 'node_modules/**', 'public/**'],
  },
});
