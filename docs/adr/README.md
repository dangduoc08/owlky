# Architecture Decision Records

Short, numbered records of decisions that shape the codebase. Change a decision by adding a new
ADR that supersedes the old one — don't rewrite history.

| #                                              | Decision                                                                  | Status   |
| ---------------------------------------------- | ------------------------------------------------------------------------- | -------- |
| [0001](0001-monorepo-and-packages.md)          | Monorepo with five packages and strict boundaries                         | Accepted |
| [0002](0002-design-tokens.md)                  | TypeScript tokens → CSS variables, AA-checked                             | Accepted (brand-color contrast rules superseded by 0014) |
| [0003](0003-styling-architecture.md)           | `data-ok-*` anatomy, zero-specificity CSS in cascade layers, prebuilt CSS | Accepted |
| [0004](0004-shared-core.md)                    | Shared framework-free core for behavior and anatomy                       | Accepted |
| [0005](0005-html-runtime.md)                   | HTML Core Runtime: registry, delegation, lifecycle, idempotency           | Accepted |
| [0006](0006-browser-baseline-and-fallbacks.md) | Browser baseline and native-API fallbacks                                 | Accepted |
| [0007](0007-shared-state-and-versioning.md)    | Page-wide shared state and runtime version policy                         | Accepted |
| [0008](0008-framework-independence.md)         | Framework independence, enforced                                          | Accepted |
| [0009](0009-build-and-publishing.md)           | Build, distribution and publishing                                        | Accepted (publishing trigger superseded by 0012) |
| [0010](0010-testing-strategy.md)               | Testing strategy                                                          | Accepted |
| [0011](0011-foundations-first.md)             | Foundations first; sample components removed (references in git)        | Accepted ("AA wins" superseded by 0014, Storybook layout by 0018 and 0019) |
| [0012](0012-release-by-tag.md)                | Release only from `release/v*` tags on main                              | Accepted |
| [0013](0013-translucent-colors-via-channels.md) | Translucent colors via RGB channel tokens (no `color-mix()` in components) | Accepted |
| [0014](0014-brand-colors-follow-reference.md) | Brand colors follow the reference look (white on fills, `main` text) | Accepted |
| [0015](0015-component-api-and-option-schema.md) | Component API from the upstream component; one option schema for React and HTML | Accepted |
| [0016](0016-rename-to-owlky.md) | Rename the library to Owlky (`ok` namespace) | Accepted |
| [0017](0017-theme-presets.md) | Theme presets through data attributes (color, font, root size) | Accepted |
| [0018](0018-one-story-per-component.md) | One story per component, framework chosen in the toolbar | Accepted |
| [0019](0019-component-docs-pages.md) | A usage guide page for every component | Accepted |
| [0020](0020-data-grid.md) | Data grid: one grid engine in core, every MUI X tier, built in phases | Accepted (phase table superseded by 0021) |
| [0021](0021-data-grid-six-phases.md) | Data grid: the backlog folded into six phases | Accepted |
| [0022](0022-pickers.md) | Pickers: one picker engine in core, every MUI X tier, four phases | Accepted |
| [0023](0023-editor-on-tiptap.md) | Editor: Tiptap as the first runtime dependency, behind its own entry points | Accepted |
| [0024](0024-chart.md) | Chart: one SVG chart engine in core, written by us, four phases | Accepted (phases 3–4 superseded by 0027) |
| [0026](0026-time-pickers.md) | Time pickers: one field and picker anatomy for every value type, clocks as listboxes | Accepted |
| [0027](0027-chart-every-type.md) | Chart: every ApexCharts chart type; phases 3–4 rescoped for dashboards | Accepted |
| [0029](0029-chart-phase-3-data-model.md) | Chart phase 3: several values per point, cell charts, sparklines, live updates | Accepted |
| [0031](0031-chart-phase-4-interaction-and-links.md) | Chart phase 4: zoom as an x window, linked charts, annotations, export, last chart types | Accepted |

Template: **Context** (why decide) · **Decision** (what) · **Consequences** (trade-offs, follow-ups).
