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
| Bauhaus | Montserrat 800, uppercase | Montserrat | Montserrat uppercase | square, 2px black borders, pill chips |
| Brutalism | IBM Plex Mono | IBM Plex Mono | IBM Plex Mono | square, 1px lines |
| Neo-Brutalism | Space Grotesk | Space Grotesk | Space Grotesk | radius 8 / 12, 2px borders, hard offset shadows |
| Editorial | Noto Serif Display 900 | Source Serif 4 | Archivo uppercase, tracking 0.12em | square, rules instead of shadows |
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
| ST2 ✅ | Tokenize component CSS (clean names, no aliases); remove `data-ok-preset` / `data-ok-font`. Done 2026-11-12: the inventory's hard-coded values became ADR-0070 tokens with today's values (a computed-style comparison of every snippet found no difference); presets and font presets are gone (theme settings keep mode and font size); component icons are Solar Linear, generated into `@owlky/core` (`check:icons`, `icons.test.ts`, credit in the notices), checkbox and radio frames drawn from tokens. Open: small control sizes without a matching density token (inventory, ST2 status) | ST1, S2 merged |
| ST3 ✅ | Soft as default + the four axes + generator + AA fixes from L4; illustrations follow through tones. Done 2026-11-13: Soft's tokens are the default (indigo / zinc from Tailwind v4, Nunito, radius 10 / 18px, pill chips and labels, two-layer shadows, stroke 1.5); `data-ok-style`, `-density`, `-surface`, `-contrast` nest independently through one resolver of space toggles ([ADR-0072](adr/0072-theme-switches-and-resolver.md): exact `rgb()` colors, no inputs in the core sheet, token trims to fit the CSS budgets); the generator (`packages/tokens/src/roles.ts`, from L4) derives every role at 4.5:1 / 3:1 and 7:1 / 4.5:1 in high contrast by moving only OKLCH lightness, `roles.test.ts` checks every pair; L4's AA fixes (text tones for colored text, `CONTRAST_EXEMPT` = disabled parts only) plus field outlines on `--ok-control-border-color`; compact density values, including the six sizes ST2 left on spacing; `applyThemeSettings`, `createTheme({ style, brand, fonts })`, `applyThemeBrand()` (`@owlky/core/theme-brand`), Tailwind keys (`rounded-control`…, `font-label`, `contrast-high:`, `compact:`); Phone input image flags (Circle Flags, opt-in). Open for ST4: per-style shadow geometry (ADR-0072 § 4), chart series tokens in the sheet with the Chart defaults, the CDN `theme` module for run-time brand colors | ST2 |
| ST4 | The eight other styles as opt-in files. **ST4a done 2026-11-13** ([ADR-0073](adr/0073-style-sheets-and-shadow-treatments.md)): the shared infrastructure (one definition file per style, sheets generated by `@owlky/tokens` into `@owlky/styles/styles/<id>.css` and CDN `owlky-style-<id>.css`, a `./styles/*` export, `families.json` `styles` filled at build time, a size budget per sheet), shadow treatments (soft, subtle, flat, hard) through one shared switch, elevations as aliases of the named shadows, `fontWeight` / `borderWidth` style inputs, a Storybook `style` global and parameter; **Swiss** and **Neo-Brutalism** (about 2.6 kB gzip each). ST4b: the six others, in parallel, by the recipe below | ST3 |
| ST5 | Storybook toolbar menus (**Style**, **Density**, **Surface**, **Contrast**), `createTheme`, Tailwind theme, HTML runtime. The website picker moves to the website plan (owner 2026-11-13: anything landing or website-design related is planned later; the website only follows the default tokens until then) | ST3 |
| ST6 | Tests: AA matrix (9 styles × light / dark × surface × high contrast, every role pair), axe on a story sample per style in e2e, `check:size`; visual baselines per style from a `workflow_dispatch` CI job that runs `pnpm test:visual:update` in the pinned Playwright Docker image and opens a PR with the images (owner 2026-11-12: no local Docker needed; the owner only reviews and merges the PR) | ST4 |
| ST7 | Docs: Foundations › Styles guide, Settings guide, README, MCP manifest, changeset (minor: styles replace presets and fonts) | ST5 |

## ST4 notes: adding a style (recipe for ST4b)
Each remaining style (Bauhaus, Brutalism, Editorial, Minimal Mono, Corporate, Nordic) is one
agent and one branch; they touch shared files only in the list lines below, so they merge with
trivial conflicts. Model: `packages/tokens/src/styles/swiss.ts` (flat) and `neo-brutalism.ts`
(hard).
1. **Definition:** `packages/tokens/src/styles/<id>.ts` exporting a `StyleDefinition`
   (`style-definition.ts` documents each field). Hues are Tailwind v4 names (`tailwindHues`);
   never write a color role: the generator derives them, and `roles.test.ts` fails when a hue
   can't reach AA (pick another hue). Fonts with `fontStack("<Family>")`, `fontLinks` in Google
   Fonts form, `fontWeight` when the font's range isn't 400–800, `borderWidth` when lines aren't
   1 / 2 / 3px, `shadows` one of `soft` · `subtle` · `flat` · `hard` (the geometry is the
   treatment's; only `shadowTint` changes a soft style's shadows), `iconStroke` from ADR-0070 § 1.
2. **List lines** in `packages/tokens/src/styles.ts`: the import, the `styleNames` entry and the
   `styles` entry (keep ADR-0070 § 1's order).
3. **Test row:** `EXPECTED.<id>` in `packages/tokens/src/styles.test.ts` (fonts, heading,
   label, radius, surface border, border width, treatment, stroke).
4. **Size budget:** run `flock /tmp/owlky-heavy.lock pnpm build`, measure
   `packages/styles/dist/styles/<id>.min.css` (gzip) and add `"<id>": measured + 5 %` to
   `STYLE_SHEET_BUDGETS` in `scripts/check-size.mjs` (it fails without an entry).
5. **Storybook fonts:** add the Fontsource package (`@fontsource-variable/<family>`, or
   `@fontsource/<family>` when there is no variable build; pin a version at least 14 days old)
   to `apps/storybook/package.json` and one `import` in `.storybook/preview.tsx`. The sheet itself
   is picked up by the glob there. View it with `&globals=style:<id>` in the story URL.
6. **Verify:** `pnpm vitest run packages/tokens packages/styles`, the core theme tests
   (`--project core packages/core/src/theme`), `pnpm check:size`, and a look at a few stories
   (Button, Card, Text field, Dialog) in the style, light and dark.

Nothing else changes: the sheet, the `@owlky/styles/styles/<id>.css` export, the CDN copy,
`families.json`, `applyThemeSettings({ style })` and the AA matrix all follow the list.

Per-style hints (ADR-0070 § 1): Bauhaus `flat`, 2px ink surface border and `borderWidth`
2 / 3 / 4px, Montserrat 800, headings and labels `uppercase`, `chip: "9999px"`, stroke 2;
Brutalism `flat`, 1px, IBM Plex Mono for every family, stroke 1.25; Editorial `flat`, Noto
Serif Display 900 headings, Source Serif 4 text, Archivo labels `uppercase` 0.12em, stroke 1.25
(its top rules instead of side borders need Paper to draw per-side borders: a component change,
not part of the definition; until then it draws a full 1px edge); Minimal Mono `soft`, 8 / 14px,
`primary` and `secondary` on a neutral hue, Inter; Corporate `subtle`, 4 / 8px, IBM Plex Sans;
Nordic `soft`, 10 / 16px, Manrope 800.

Decisions of ST4a (ADR-0073): Swiss uses a blue primary (a red one would read as the error
color) on pure greys (`neutral`); Neo-Brutalism violet / pink on `neutral`, Space Grotesk 700
headings tracked −0.01em, 2 / 3 / 4px lines, pill chips, ink shadows (dark text color in
light, light text color in dark).
ST4b: Bauhaus takes the school's triad as blue primary, yellow secondary and red error on warm
greys (`stone`), with Montserrat headings tracked 0.02em and labels 0.04em in capitals.
Brutalism takes link blue with an orange secondary on `stone`, IBM Plex Mono 700 / 600 headings
(the font stops at 700) and Plex Mono as the monospace family too.
Editorial uses a rose primary on warm greys (`stone`
for secondary and neutral), `extrabold` 900 for its black headings, and the full 1px ink edge
until Paper draws per-side rules. Minimal Mono uses `zinc` primary, `slate` secondary and a
`zinc` neutral, Inter 700 headings tracked −0.02em.
Left for ST5: the CDN loader's `style:<id>` entries (a style
set later by markup loads its sheet) and the Storybook **Style** menu.

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
