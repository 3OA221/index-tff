# index-tff

A browsable archive of student work for the atelier TFF, Czech and English. Plain HTML, CSS and JavaScript: no build step, no dependencies, nothing to install.

## Structure

| Path | Description |
|---|---|
| `index.html` | Landing page: about text, filterable list of works, footer |
| `work.html` | One page for every work, opened as `work.html?id=NN` |
| `css/style.css` | All styling. Colours and spacing are variables at the top |
| `css/fonts.css`, `fonts/` | Self-hosted fonts (Inter, Newsreader, Space Grotesk, IBM Plex Mono) |
| `js/works.js` | The works: titles, authors, texts, images, everything shown per work |
| `js/announcements.js` | Text of the strip at the very top (Czech and English) |
| `js/filter.js` | Search, filters, grid and list view |
| `js/work.js` | Work pages and the fullscreen image viewer |
| `js/logo.js` | The cube logo and its small effects |
| `js/side.js` | Logo size and colour changes while scrolling, language switch over the footer |
| `js/site.js`, `js/ticker.js` | Language switching, the top strip |
| `favicon.svg`, `favicon.ico`, `favicon-64.png`, `apple-touch-icon.png` | Browser tab icon: the logo (the SVG switches between dark and white with the browser theme) |
| `img/NN/` | Images of work number NN, each as a full size and a `-thumb` file (webp) |

## Changing content

- **Announcement strip:** edit `js/announcements.js`.
- **A work's text, credits or details:** edit its entry in `js/works.js`. Fields: `id`, `title`, `authors`, `year`, `study` (study year), `mediums`, `format`, `duration` (optional, videos), `description` (`original` and `en`), `socials`, `links`, `media`.
- **Videos:** the authors upload to YouTube; put the video IDs into `media.videoEmbed` of that work.
- **New work or new images:** the image files need resized and thumbnail versions plus their sizes in `works.js`. Easiest is to do this in the website chat of the Claude Project.

## Order and filters

The grid and Previous / Next on work pages share one order: newest year first, then by work number. Filter options are alphabetical, or numerical for years and study years.

## Rights

No licence is attached. All rights are reserved by default. Every work, image and text belongs to its author. The fonts keep their own open licence (SIL Open Font License).
