---
"@owlky/react": minor
"@owlky/html": minor
---

Load the rarely used parts of heavy components on demand (ADR-0068, size roadmap S5). No API changes:

- **React `DataGrid`:** the Chart of the charts integration loads on first use. Until it is in, the grid renders the chart's root and its data table, the chart's state without JavaScript.
- **HTML data grid:** the chart helpers load with the first chart, so a grid without charts no longer downloads the chart engine.
- **React `CircularProgress` and `LinearProgress`:** the scroll controller of the `scroll` prop and the Motion engine it runs on load on first use, so a plain progress (every Button loader) no longer bundles them.
- **CDN `illustration` module:** the picture data is a chunk of its own. A page whose SVGs carry their shapes only downloads the sizing code.
- **CDN lazy modules:** they join the runtime of the `owlky.js` that loads them and no longer carry a second copy of the runtime factory. Load `owlky.js` before importing a module directly.
