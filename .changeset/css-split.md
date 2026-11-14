---
"@owlky/styles": minor
"@owlky/html": minor
---

Split the stylesheet (ADR-0068 section 5). `owlky.css` and `owlky.min.css` are now the core sheet: the design tokens and the light components, 29.4 kB gzip instead of 63.4 kB. The large components (Chart, Data grid, Date and time pickers, Gantt, Carousel and Lightbox, Motion extras, Organization chart, Upload, Walktour, Tree view, Sortable, Autocomplete, Transfer list, Markdown, Editor, Map, Code editor, Phone input and Illustrations) keep their styles in their own files. New: `owlky-all.css` and `owlky-all.min.css` hold every component in one file (the old `owlky.css`), and `modules/<name>.css` sit next to each CDN module.

On the CDN, `owlky.js` attaches a module's stylesheet before its code runs, so a page with the core `owlky.css` link needs no change. `data-ok-preload` loads the stylesheet too, and the guides show `<link rel="preload" as="style">`.

Migration for apps that import `@owlky/styles/owlky.css` (or `@owlky/html/owlky.css` from a CDN without the loader) and use a large component: import `@owlky/styles/owlky-all.css` instead, or keep `owlky.css` and add the component's file after it (`@owlky/styles/components/data-grid.css`; each docs page's **Import** table lists the files in order). The `index.css` source order now lists the light files first and the lazy families after them.
