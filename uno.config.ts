import { defineConfig, presetWind4 } from 'unocss';

// Design tokens (spec section 7). Colours that change in the works zone are
// also exposed as CSS variables in src/styles/global.css.
export default defineConfig({
  presets: [presetWind4()],
  theme: {
    colors: {
      ink: '#202020',
      surface: '#DCDCDC',
      muted: '#5A5A5A',
      'muted-on-ink': '#B4B4B4',
      placeholder: '#CBCBCB',
      strip: '#0A0A0A',
      'surface-zoom': '#FFFFFF',
      'placeholder-zoom': '#EDEDED',
    },
    font: {
      sans: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      text: "Newsreader, Georgia, 'Times New Roman', serif",
      forma: "'Space Grotesk', Inter, system-ui, sans-serif",
      funkce: "'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace",
    },
  },
});
