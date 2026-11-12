# Roadmap: design styles (draft, under discussion)

Status: approved 2026-11-12; starts after S2 and L4a are merged. Part of "Road to 0.1.0"
(`docs/roadmap-0.1.0.md`): it replaces track 2's L4 (own colors and font). L4a (demo content,
notices, license check) continues unchanged.

## Goal
A **style** is a full design preset: palette, fonts, radius, border widths, shadow treatment,
label case and heading weight. Components keep their markup and API; a style only sets token
values. Reference demo: the dashboard lab (owner review, 2026-11-12).

## Decisions (owner, 2026-11-12)
| # | Decision |
|---|---|
| D1 | Nine styles: **Soft** (default), Swiss, Bauhaus, Brutalism, Neo-Brutalism, Editorial, Minimal Mono, Corporate, Nordic. |
| D2 | Axes, each one data attribute, nestable like `data-ok-theme`: mode light / dark / system (exists), density comfortable / compact, surface contrast default / high, high contrast off / on (hues kept, text 7:1, graphics and borders 4.5:1). |
| D3 | Nav color (integrate / apparent) is a dashboard layout concern, not a component one: not in the library; it goes to the Blocks backlog (dashboard shell). |
| D4 | Fonts as in the demo (table below). Owlky still doesn't bundle fonts; docs give the font links. |
| D5 | Soft is the default: a page without `data-ok-style` looks Soft. |

| Style | Headings | Text | Labels | Shape |
|---|---|---|---|---|
| Soft | Nunito 800 | Nunito | Nunito | radius 10 / 18, two-layer soft shadows |
| Swiss | Inter 800, tracking −0.03em | Inter | Inter | square, 1px ink lines instead of shadows |
| Bauhaus | Lexend 800, uppercase | Lexend | Lexend uppercase | square, 2px black borders, pill chips |
| Brutalism | IBM Plex Mono | IBM Plex Mono | IBM Plex Mono | square, 1px lines |
| Neo-Brutalism | Space Grotesk | Space Grotesk | Space Grotesk | radius 8 / 12, 2px borders, hard offset shadows |
| Editorial | Playfair Display 900 | Source Serif 4 | Be Vietnam Pro uppercase, tracking 0.12em | square, rules instead of shadows |
| Minimal Mono | Inter | Inter | Inter | radius 8 / 14, greys only |
| Corporate | IBM Plex Sans | IBM Plex Sans | IBM Plex Sans | radius 4 / 8 |
| Nordic | Manrope 800 | Manrope | Manrope | radius 10 / 16 |

## Decisions on the approach (owner, 2026-11-12)
1. **Starts after S2 and L4a are merged.** A style decides colors and fonts: the color presets
   (`data-ok-preset`) and font presets (`data-ok-font`) are **removed**, with their CSS, schema
   entries, toolbar menus and docs. A brand color or font stays possible without an attribute:
   override the public tokens (`--ok-palette-primary-*`, `--ok-font-family`) or `createTheme()`.
2. **Not published, so no compatibility layer:** tokens, attributes and `createTheme()` options
   are renamed or removed when that gives the cleanest design; no aliases, no deprecated names,
   no dead CSS. Every hard-coded radius, border, shadow, font, case and control size in component
   CSS becomes a style token.
3. **Attributes:** `data-ok-style="<name>"`, `data-ok-density="compact"`,
   `data-ok-surface="contrast"`, `data-ok-contrast="high"`, nestable like `data-ok-theme`;
   `applyThemeSettings()`, `createTheme({ style })`, the Tailwind theme and the HTML runtime use them.
4. **Delivery:** Soft lives in `owlky.css`; the other eight are opt-in files
   (`@owlky/styles/styles/<name>.css`, CDN `owlky-style-<name>.css`), about 2–4 kB each.
5. **L4 is not finished as it was:** its Indigo / Zinc / Be Vietnam Pro defaults would be thrown
   away by ST3. ST3 takes only its role generator and AA fixes (cherry-picked from the L4 branch);
   the rest of the branch is dropped. ADR-0070 "Design styles" supersedes ADR-0069's defaults and
   ADR-0017 (presets and fonts as attributes), keeping 0069's rules: palettes from Tailwind's MIT
   palette, roles chosen by the generator, AA everywhere with no brand-text exemption.
6. **Lands before 0.1.0.** After the release, a new style or token is minor; a default change, a
   removed token or a renamed style is major.

## Phases
| Phase | Scope | Depends on |
|---|---|---|
| ST1 ✅ | ADR-0070, token inventory (every hard-coded radius, border, shadow, font, case, height in `packages/styles`), font check (OFL, Vietnamese subset, tabular figures). Done 2026-11-12: [ADR-0070](adr/0070-design-styles.md) decides attributes, resolver, token model, delivery, generator, icons; [inventory](styles-inventory.md) lists 386 hard-coded values, 114 component icons → 82 Solar names, the removal list, and the font check (3 fonts lack tabular figures: owner question) | — |
| ST2 | Tokenize component CSS (clean names, no aliases); remove `data-ok-preset` / `data-ok-font` | ST1, S2 merged |
| ST3 | Soft as default + the four axes + generator + AA fixes from L4; illustrations follow through tones | ST2 |
| ST4 | The eight other styles as opt-in files | ST3 |
| ST5 | Storybook toolbar menus (**Style**, **Density**, **Surface**, **Contrast**), website picker, `createTheme`, Tailwind theme, HTML runtime | ST3 |
| ST6 | Tests: AA matrix (9 styles × light / dark × surface × high contrast, every role pair), axe on a story sample per style in e2e, `check:size`; visual baselines per style from a `workflow_dispatch` CI job that runs `pnpm test:visual:update` in the pinned Playwright Docker image and opens a PR with the images (owner 2026-11-12: no local Docker needed; the owner only reviews and merges the PR) | ST4 |
| ST7 | Docs: Foundations › Styles guide, Settings guide, README, MCP manifest, changeset (minor: styles replace presets and fonts) | ST5 |

## Icons and flags (owner, 2026-11-12)
- **One icon set: Solar** (480 Design, CC BY 4.0; credit in `THIRD_PARTY_NOTICES` and the Icons
  guide). Component icons are **Solar Linear**, generated at build time from `@iconify-json/solar`
  (a dev dependency) into one core module that React and HTML both read; a test compares every path
  with the set. The stroke width is a style token (`--ok-icon-stroke`: Soft, Nordic, Swiss, Minimal
  Mono, Corporate 1.5; Editorial, Brutalism 1.25; Bauhaus, Neo-Brutalism 2; at least 1.75 in high
  contrast). The guide suggests a Solar variant per style for app icons (Soft: Bold Duotone, Nordic:
  Line Duotone, Brutalism: Broken, Bauhaus / Neo-Brutalism: Bold, the others: Linear).
- **Docs examples** use Solar: React through `@iconify/react` offline, HTML as inline SVG.
- **Removed:** Lucide (examples, `check-docs-code.mjs` list), Eva, SVG Logos, VSCode Icons, the
  hand-drawn component paths. Social sign-in demos become text buttons; Upload file types use Solar
  file icons.
- **Flags are not icons:** emoji by default (no bytes); an opt-in image mode with **Circle Flags**
  (MIT) as separate files, lazy-loaded, self-hostable (Phone input option, spec first), because
  Windows shows flag emoji as two letters.
- Phases: ST1 inventory (about 326 paths → Solar names), ST2 replace + stroke token, ST3 Phone
  input image flags, ST7 Icons guide and notices.

## Out of scope
Nav color and dashboard shells (Blocks backlog); the removed styles (Terminal, Retro 70s,
Luxury, Earthy, Playful, Ocean); bundling fonts.
