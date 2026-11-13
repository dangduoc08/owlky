# IP assessment (track 2, step L2)

Status: draft for the owner and a lawyer, 2026-11-12. **This is an engineering assessment, not
legal advice.** It classifies every row of [`inventory.md`](inventory.md) (same ids) so that L3
(identity ADR), L4 (replace) and L5 (notices) have a work list, and it lists the questions a
lawyer must answer before 0.1.0.

## Executive summary

90 inventory rows (F5 = R14 and A5 = I5 are counted once):

| Class | Rows | Meaning |
|---|---|---|
| **Own work** | 15 | written in this repository, MIT under our `LICENSE` |
| **Permissive, attribution needed** | 49 | MIT / BSD / ISC / Apache-2.0 / OFL / CC BY / CC0 / public domain: allowed, with the notice listed below (or no duty, for npm dependencies we don't redistribute) |
| **Needs permission or a decision** | 16 | legally unclear or a choice for the owner (keep with attribution vs. replace) |
| **Must not ship** | 10 | taken from the paid Minimal kit (no license) or a close copy of its look or demo content |

Biggest risks first:

1. **The default theme is the reference kit's theme.** Every palette value, the grey scale, all
   custom shadows and the whole type scale match the Minimal kit exactly (T1–T10). Most of them
   (grey, secondary to error, shadows, type scale) are **also** in Minimal's free MIT edition, so
   they could be kept with that MIT notice. The **green primary, the five presets, the dark scheme
   and the Public Sans / font-preset choice are only in the paid kit**. Together with T15
   (component skins recorded from the paid demo pages), the library *looks like* Minimals Pro.
   That is the owner's identity problem (L3 / L4). Whether it is also a legal problem (copyright in
   a selection of values, trade dress, unfair competition, the minimals.cc site terms) is a
   question for the lawyer.
2. **Paid-kit demo content ships on npm.** Minimals mock names (C1) and the `2Minimal` value (C2)
   are in `@owlky/html/dist/snippets` and in `@owlky/mcp`'s `manifest.json`. ApexCharts demo
   series, some changed by a few units (C5), are in the chart snippets and the manifest.
3. **Third-party code ships with no notice file.** `@owlky/html/dist` (editor, markdown, phone,
   map bundles and the 16 MB `monaco/` folder) and `@owlky/core/dist/map/worker.js` contain MIT,
   BSD-2, BSD-3, ISC, Apache-2.0 (libphonenumber metadata, TypeScript inside Monaco, DOMPurify)
   and possibly CC BY 4.0 (the Codicon font) code. None of them has a `LICENSE` or
   `THIRD_PARTY_NOTICES` entry next to it. Minifying removed nearly every license comment. BSD
   and Apache-2.0 require the notices with binary distributions. **This is the clearest
   compliance gap, and the easiest one to fix (L5).**
4. **The public wording is inaccurate.** `README.md` says Owlky "uses none of its code or
   assets". The code part is true as far as this inventory can tell. The design values (T1–T12)
   and the demo content (C1, C2) contradict "assets". `packages/tokens/README.md` says the brand
   colors "follow the Minimal reference".
5. **The name has not been searched.** No trademark search for "Owlky" is recorded (N1). There is
   no logo yet (N2), so nothing to clear there.

What is clean: no copyleft-only or unknown licenses in any production tree; no upstream UI library
code copied (only API names and behavior mapped, ADR-0015); illustrations, pictures, avatars,
landing page, docs prose and most sample data are original; map data is public domain or
attributed at run time; fonts are OFL and the library ships only font *names*.

**Note (2026-11-13):** the opt-in scripts named below (`owlky-editor.js`, `owlky-markdown.js`,
`owlky-phone.js`, `owlky-map.js`) were replaced by the lazy ES modules of `owlky.js`
(`dist/modules/`, ADR-0068) and removed before 0.1.0. The same packages ship in those modules.

## Classification

### 1. Runtime dependencies

| Id | Class | Reason |
|---|---|---|
| R1 Tiptap | Permissive, attribution | MIT; bundled in `owlky-editor.js`: keep "Copyright (c) 2025, Tiptap GmbH" + MIT text with the bundle |
| R2 ProseMirror family | Permissive, attribution | MIT; bundled; one entry per package or one per holder (Marijn Haverbeke and others) |
| R3 linkifyjs | Permissive, attribution | MIT; bundled |
| R4 unified ecosystem | Permissive, attribution | MIT; about 70 packages bundled in `owlky-markdown.js`; generate the entries from `pnpm licenses` (many holders) |
| R5 parse5 | Permissive, attribution | MIT; bundled |
| R6 entities | Permissive, attribution | BSD-2-Clause; the copyright and disclaimer must be reproduced in the documentation of a binary distribution |
| R7 @ungap/structured-clone | Permissive, attribution | ISC; bundled |
| R8 libphonenumber-js | Permissive, attribution | MIT; bundled in `owlky-phone.js` |
| R9 libphonenumber metadata | Permissive, attribution | Apache-2.0 (Google): include the Apache-2.0 text and an attribution line; it is a modified (compiled) form, which Apache allows with a change notice |
| R10 maplibre-gl (+ its bundled deps) | Permissive, attribution | BSD-3-Clause and the notices inside its `LICENSE.txt`; bundled in two HTML files **and** in `@owlky/core` (`dist/map/worker.js`). Ship the full `LICENSE.txt` |
| R11 monaco-editor | Permissive, attribution | MIT + Microsoft's `ThirdPartyNotices.txt` (W3C, Apache-2.0, MIT entries): copy both into `dist/monaco/` |
| R12 DOMPurify in Monaco | Permissive, attribution | dual `(MPL-2.0 OR Apache-2.0)`: choose Apache-2.0 and say so; no copyleft duty then |
| R13 marked in Monaco | Permissive, attribution | MIT |
| R14 Codicon font in `monaco.css` | Permissive, attribution (to confirm) | upstream says icons are CC BY 4.0. If so, credit "Codicons by Microsoft, CC BY 4.0" with a link. Confirm against the `@vscode/codicons` version Monaco 0.57 embeds |
| R15 Floating UI | Permissive, no notice from us | npm dependency, stubbed out of the bundle |
| R16 Date adapters | Permissive, no notice from us | peer dependencies, never bundled |
| R17 MCP SDK, zod and tree | Permissive, no notice from us | npm dependencies of `@owlky/mcp`, not bundled |
| R18 React | Permissive, no notice from us | peer dependency; website covered in D7 |
| R19 Our bundles and npm builds | Own work | MIT `LICENSE` present in every package |
| R20 lowlight / highlight.js | Permissive, no duty | not shipped; users install them |

### 2. Dev and docs-only

| Id | Class | Reason |
|---|---|---|
| D1 Storybook | Permissive, attribution | MIT; only matters if a built Storybook is deployed |
| D2 Solar icons | Permissive, attribution | CC BY 4.0. The page credits the author and license. Add a license link and a "subset, recolored" note. The committed `icon-data.json` is a redistribution in the public repository: add the credit there too (in L5's notices) |
| D3 Eva Icons | Permissive, attribution | MIT; MIT text in the notices for the repository copy |
| D4 SVG Logos (brand marks) | Needs a decision | artwork CC0, but Google, Facebook, Instagram, LinkedIn, X and GitHub logos are trademarks. Showing them as "social sign-in" icons in docs is common nominative use, but each owner has brand rules. Decide: keep (follow each brand's rules, no modification) or replace with neutral glyphs |
| D5 VSCode Icons (file types) | Needs a decision | set MIT, but the Word / Excel / PowerPoint / Photoshop / Illustrator icons reproduce Microsoft and Adobe marks. Same choice as D4. Generic file-type glyphs would avoid the question |
| D6 Circle Flags | Permissive, attribution | MIT |
| D7 Next.js / React on the website | Permissive, attribution | MIT; the website should carry a notices page for its bundled runtime |
| D8 Shiki + theme | Permissive, no duty | build-time tool; output is ours |
| D9 Pagefind | Permissive, attribution | MIT; its JS / WASM ships on the website |
| D10 lucide-react (examples) | Permissive, no duty | users install it; examples only name it |
| D11 @iconify/react | Permissive, no duty | docs tooling |
| D12 Tooling | Permissive, no duty | nothing reaches `dist` |

### 3. Fonts

| Id | Class | Reason |
|---|---|---|
| F1 Public Sans | Permissive, attribution | OFL-1.1. The library ships the name only. The website and Storybook serve the files from Fontsource, which carries the OFL text. Note: choosing Public Sans is part of the paid kit's look (T10); the license is fine |
| F2 Barlow | Permissive, attribution | OFL-1.1, same as F1. Barlow for headings is also in the free MIT kit |
| F3 Inter, DM Sans, Nunito Sans | Permissive, attribution | OFL-1.1; the *list* of presets is the paid kit's (T10) |
| F4 Monospace stack | Permissive, no duty | system fonts, names only |

### 4. Images, icons, map and sample data

| Id | Class | Reason |
|---|---|---|
| I1 Illustration set | Own work | ADR-0041 records that no Minimals, unDraw or Humaaans art was used. Recommended: the owner confirms that every picture was drawn in this repository |
| I2 Avatars | Own work | simple original SVGs. Their fills are palette hex values (T1–T3), which change with L4 |
| I3 Abstract pictures | Own work | written in the repository, no source cited |
| I4 `video.webm` | Needs a decision | no source or generator recorded. If it was generated here, record how (or regenerate it with a committed script). Otherwise replace it |
| I5 Component icons (Lucide-identical paths) | Needs a decision | 0 matches with the five Iconify sets. At least four paths look identical to Lucide (ISC). Either add the Lucide ISC notice to `@owlky/react` and `@owlky/html`, or redraw them. Run an automated comparison against `lucide-static` before deciding (not installed here) |
| I6 GitHub mark on the website | Permissive, attribution | GitHub allows its mark for links to GitHub under its logo guidelines |
| M1–M4, M6 Natural Earth, USGS, Census | Permissive, no duty | public domain; keep the source comments and credit them in the docs as a courtesy |
| M5 OpenFreeMap / OpenMapTiles / OSM | Permissive, attribution | ODbL and OpenMapTiles attribution is shown by `AttributionControl`. Keep it on in every story and docs example that uses these tiles. The library itself ships no tiles |
| M7 Map fixtures | Own work | written in the repository |
| M8 Phone flags and names | Own work | Unicode emoji and `Intl` names at run time |

### 5. Design values

| Id | Class | Reason |
|---|---|---|
| T1 Grey scale | Needs a decision | identical to the free kit (MIT, "Copyright (c) 2021 Minimal UI"), so it can be kept with that notice. It is still the reference's signature neutral scale, so L3 should replace it if the goal is an own identity. Lawyer: does a later MIT copy cover values first recorded from the paid demo site? |
| T2 Secondary, info, success, warning, error | Needs a decision | same as T1 (exact free-kit match) |
| T3 Green primary | **Must not ship** | paid kit only; it is the most recognizable part of the reference look |
| T4 Primary presets | **Must not ship** | paid kit only ("from the reference Settings drawer") |
| T5 Light scheme text, action and divider alphas | Needs a decision | matches the free kit (MIT). These are generic alpha steps of one grey; they change with T1 anyway |
| T6 Dark scheme | **Must not ship** | paid kit only (the free kit has no dark scheme) |
| T7 Custom shadows | Needs a decision | exact free-kit match (MIT). The tinted grey shadows and the offset dropdown / dialog shadows are a signature of the kit. Keep with the MIT notice or design new ones in L3 |
| T8 Elevation 1–24 | Permissive, attribution | MUI's default shadow table, MIT. Values are arguably not protectable, but credit MUI in the notices to be safe |
| T9 Type scale + Barlow headings | Needs a decision | exact free-kit match (MIT); keep with the notice or redesign |
| T10 Public Sans default + font preset list | **Must not ship** | the paid kit's font choice and Settings list (the free kit uses DM Sans). The fonts themselves are fine (OFL) |
| T11 MUI breakpoints, z-index, durations, easings | Permissive, attribution | MUI defaults, MIT; generic values |
| T12 Minimals Animate easing and enter / exit durations | **Must not ship** | from the reference's Animate (paid kit); cheap to replace |
| T13 Radius and spacing scales | Own work | generic values (Tailwind 4 px spacing, common radii) |
| T14 "White on fills, `main` text" contrast rule | Needs a decision | a rule, not an asset (MUI's 3:1 `getContrastText` is MIT). Restate it in L3 as our own decision, or return to AA defaults |
| T15 Component signature details | **Must not ship** (as a set) | recorded from computed styles of the paid demo pages: soft variants, Label metrics, Paper / Card details, inherit buttons, and the skins of paid-only components (Upload, Editor, Carousel, Lightbox, Walktour, Organization chart, pickers, data grid). No single value is likely protectable. Together they are a close copy of the paid kit's look and feel, which the owner wants to remove. L4 sweeps the 95 CSS lines that cite the reference |
| T16 Storybook brand color | **Must not ship** | it is T3 |

### 6. Content

| Id | Class | Reason |
|---|---|---|
| C1 Minimals mock names | **Must not ship** | paid-kit demo data (not in the free kit), shipped in `@owlky/html/dist/snippets` and `@owlky/mcp` |
| C2 `2Minimal` demo value | **Must not ship** | reference demo text and the reference's name, shipped in snippets and the manifest |
| C3 MUI desserts table | Permissive, attribution | MUI docs are MIT. Replacing them is cheap and removes the attribution need. Recommended |
| C4 Movie titles | Permissive, no duty | titles are facts; the list shape follows MUI's docs (MIT). Replace for distinctiveness |
| C5 ApexCharts demo series | **Must not ship** | demo data of the reference's chart page, some values changed by a few units. The ApexCharts samples' license is unclear (not MIT since v4). The numbers are trivial, but they are a close copy of reference content and cheap to regenerate |
| C6 Story structure, `Reference URL` lines, `referenceUrl` in the manifest | Needs a decision | section names ("Basic", "Sizes") aren't protectable, and the repository may keep its research links. Decide whether `@owlky/mcp` and the website keep shipping `referenceUrl` links to minimals.cc and "Audit against Minimals" text (identity, and N3) |
| C7 MUI-docs sentences | Permissive, attribution | MIT (MUI docs repository). Rewrite the four descriptions instead; trivial |
| C8 API of Minimals' own wrappers (Upload, UploadAvatar, UploadBox, Label, Editor and Image wrappers, Animate, Organization chart…) | Needs a decision | interface names and prop lists, no code. Interfaces are generally treated as functional, but these come from a paid product the owner has no license for. Lawyer question 3. Engineering option: keep the upstream library APIs (react-dropzone, Tiptap, Framer Motion) and rename what only the paid wrappers define |
| C9 Upstream API names (ADR-0015) | Own work | interoperable names mapped prop by prop; the implementations are ours. ApexGantt and the ApexCharts family are commercial: names and behavior only, no code (ADR-0024, ADR-0048) |
| C10 Docs prose, guides, website copy | Own work | written in the repository; spot checks found only C7 |
| C11 Picker locale strings | Needs a decision | origin not recorded. If taken from MUI X `locales`, it is MIT and needs an attribution. Otherwise it is ours. Check the strings against MUI X |
| C12 Landing page | Own work | written in the repository, merged |
| C13 Org chart, Gantt, grid, tree sample data | Own work | original names and data |

### 7. Names and marks

| Id | Class | Reason |
|---|---|---|
| N1 "Owlky" | Needs a decision | needs a trademark clearance search (classes 9 and 42 at least) before 0.1.0 |
| N2 Logo | Own work (n/a) | none exists. L3 should design an original mark and record its author |
| N3 "Minimal" in public text | Needs a decision | nominative references are generally allowed, but the README's "uses none of its code or assets" is inaccurate (T1–T12, C1, C2). Rewrite after L4 as a factual "visual language originally inspired by …; not affiliated with Minimal UI or MUI". Remove "Minimal" from demo values, JSDoc and the shipped manifest |
| N4 MUI / Apex / Framer… in API text | Permissive, no duty | nominative "API like X" use. Add one "not affiliated, trademarks of their owners" line to the READMEs, the docs and the website footer |
| N5 Brand icons in docs | Needs a decision | the same decision as D4 / D5: the trademark side of those icons |
| N6 Package metadata | Own work | add `author` (and the copyright holder's legal name, see question 6) |

### 8. Code

| Id | Class | Reason |
|---|---|---|
| A1 Collapse duration formula | Permissive, attribution | MUI (MIT); one formula. Credit MUI in the notices |
| A2 Framer Motion spring defaults | Permissive, attribution | MIT constants; the solver is public math |
| A3 Published algorithms | Own work | written from papers, no code copied |
| A4 Behavior mapped from Sonner, react-joyride, Embla, react-dropzone, yet-another-react-lightbox | Own work | names and behavior only; no copied code found by search or source maps |
| A6 Spec API tables | Permissive, no duty | maintainer docs paraphrasing MIT docs; not shipped as text except through the manifest |

## "Must not ship" list (L4 work list)

| # | Row | Replacement idea |
|---|---|---|
| 1 | T3 Green primary | An own primary hue picked in L3, with tones generated by one documented formula (for example OKLCH lightness steps at fixed chroma). Then `paletteTextFor` picks the AA text tones. Avoid `#00A76F`-like greens to stay visibly distinct |
| 2 | T4 Presets | Presets generated by the same formula from our own hue list (and named for it), not the reference's five |
| 3 | T6 Dark scheme | Dark surfaces derived from our own neutral scale (for example the L3 grey at fixed OKLCH steps); text tones selected by the existing AA test |
| 4 | T10 Font choice | Pick an own OFL pairing in L3 (not Public Sans + Barlow), and an own preset list. Keep the 12–20 px root-size range (generic) |
| 5 | T12 Motion easing and durations | Own easing curve and enter / exit durations derived from the duration scale |
| 6 | T15 Component signatures | In L3, define our own radius, shadow, tint and density character. In L4, sweep every CSS line that cites the reference and every spec value recorded from minimals.cc, and restyle the paid-only components (Upload, Editor, Carousel, Lightbox, Walktour, Organization chart, picker and data grid skins). The soft variant can stay as a concept: tinted backgrounds are generic. Its exact 16 % tint, dark text tone and Label metrics should change |
| 7 | T16 Storybook brand color | Use the L3 primary |
| 8 | C1 Mock names | Our own name list (one file of diverse invented names, as in `organization-chart-data.ts`); regenerate snippets and the manifest |
| 9 | C2 `2Minimal` | A neutral value such as `Hello world` in stories and snippets |
| 10 | C5 Chart demo data | Generate series from a seeded function in `chart-data.ts` (our own trends), or use public-domain data (Census, USGS, NOAA); regenerate snippets |

Also recommended in L4 although allowed (cheap, removes attribution or doubt): replace C3
(desserts) and C4 (movies), rewrite C7, record or redo I4, and decide T1 / T2 / T5 / T7 / T9 (keep
with the Minimal UI MIT notice, or replace in L3, which the identity goal suggests).

## Notices list (L5)

No bundle or package has a `THIRD_PARTY_NOTICES` file today. Only the two MapLibre worker copies
keep an `@license` comment (a URL), and Monaco's `typescript.worker.js` / `html.worker.js` keep
some upstream headers. Each item below needs an entry with the license text and copyright line:

| Ships in | Entries |
|---|---|
| `@owlky/html/dist/owlky-editor.js` | Tiptap (MIT, © 2025 Tiptap GmbH); ProseMirror packages, `orderedmap`, `rope-sequence`, `w3c-keyname` (MIT, © Marijn Haverbeke and others); `linkifyjs` (MIT, © 2024 Nick Frasser) |
| `@owlky/html/dist/owlky-markdown.js` | unified / remark / rehype / mdast / hast / micromark / vfile / unist packages (MIT, © Titus Wormer and others: generate one entry per package); `parse5` (MIT); `entities` (BSD-2-Clause, © Felix Böhm); `@ungap/structured-clone` (ISC); `property-information`, `html-url-attributes`, `hast-util-sanitize` (MIT) |
| `@owlky/html/dist/owlky-phone.js` | `libphonenumber-js` (MIT, © 2016 catamphetamine); libphonenumber metadata (Apache-2.0, Google; full license text) |
| `@owlky/html/dist/owlky-map.js`, `owlky-map-worker.js`, **`@owlky/core/dist/map/worker.js`** | MapLibre GL JS `LICENSE.txt` in full (BSD-3-Clause, © 2023 MapLibre contributors; © 2020 Mapbox; the Evan Wallace, Mike Bostock and other notices in it) |
| `@owlky/html/dist/monaco/` | Monaco `LICENSE` (MIT, © Microsoft) + Monaco's `ThirdPartyNotices.txt` verbatim; DOMPurify (Apache-2.0 chosen of `MPL-2.0 OR Apache-2.0`); marked (MIT); Codicons (CC BY 4.0, if confirmed) |
| `@owlky/tokens`, `@owlky/styles`, `owlky.css` (only if T1 / T2 / T5 / T7 / T9 are kept) | Minimal UI free kit (MIT, "Copyright (c) 2021 Minimal UI (https://minimals.cc/)"); MUI (MIT, "Copyright (c) 2014 Call-Em-All") for T8 / T11 |
| `@owlky/core` | MUI (MIT) for A1, Framer Motion (MIT) for A2 if the owner wants to credit values (conservative); MapLibre (above); MUI X (MIT) if C11 came from it |
| `@owlky/react`, `@owlky/html` | Lucide (ISC) if I5 confirms copied paths |
| `@owlky/mcp` (`manifest.json`) | MUI (MIT) while C3 / C7 content stays in it |
| Website (owlky.com) | Next.js, React (MIT); Pagefind (MIT); the fonts it serves (OFL-1.1 text per family); the Owlky CDN copy's notices (above); Solar (CC BY 4.0) and the other icon sets once Foundations › Icons moves there; OpenFreeMap / OpenMapTiles / OSM on map pages |
| Repository (public on GitHub) | `icon-data.json`: Solar (CC BY 4.0), Eva (MIT), VSCode Icons (MIT), Circle Flags (MIT), SVG Logos (CC0); Natural Earth, USGS and Census credits for the data in `apps/storybook/public/maps` |

L5's check script can build most entries from `pnpm licenses list --prod --json` plus the bundles'
source maps (the method used here). It should fail when a package found in a source map has no
entry.

## Questions

### For the owner

1. **Identity scope.** Replace every value that matches the Minimal kit, including those that are
   also in its free MIT edition (T1, T2, T5, T7, T9)? Or keep those with the Minimal UI MIT notice
   and replace only the paid-only ones (T3, T4, T6, T10, T12, T15)? The goal "own visual identity"
   suggests replacing all of them. Keeping them is cheaper, and probably allowed.
2. **ADR-0014.** With an own palette, keep "white on fills, main-colored text" (below AA for brand
   text), or go back to AA-first brand colors?
3. **Brand icons in docs** (D4, D5): keep the Google / Facebook / Microsoft / Adobe marks in
   examples, or use neutral glyphs?
4. **Provenance.** Can you confirm that the illustrations (I1), the pictures (I3) and the video (I4)
   were made in this repository, and how the video was produced?
5. **Reference links in shipped artifacts** (C6, N3): may `@owlky/mcp` and the website keep
   linking minimals.cc and naming "Minimals", or should the shipped manifest drop `referenceUrl`
   and the audit notes (the repository can keep them)?
6. **Copyright holder.** "Owlky contributors" in `LICENSE`: is that the intended holder, or should
   it be your legal name or a company? Will outside contributions need a DCO or CLA?
7. **Did you ever accept minimals.cc's or the MUI Store's terms** (an account, a purchase or a
   free download of the free kit)? That decides which terms apply to question 2 for the lawyer.

### For a lawyer

1. **Design values.** Are a design system's color hex values, shadow parameters and type scale,
   recorded from a public demo site of a paid template, protectable as copyright (alone or as a
   selection or compilation), as trade dress, or under unfair competition law in the US, the EU and
   Vietnam?
2. **Free MIT edition.** The same values are published by the same author under MIT in
   `minimal-ui-kit/material-kit-react`. Does keeping them with that MIT notice cure any claim,
   even though they were first recorded from the paid demo site? Does it matter which source they
   were actually taken from?
3. **APIs of paid components.** Is mapping the prop names and component names of a paid kit's own
   wrapper components (C8: `UploadAvatar`, `Label` variants, the Editor and Image wrapper props)
   lawful without a license, given that no code was copied?
4. **Website terms.** Do minimals.cc's site terms ("© All rights reserved") restrict recording
   computed styles and page structure for building a competing open-source library? Does the
   MUI Store Standard License bind someone who never bought the item?
5. **"Inspired by" statements.** Is "visual language originally inspired by Minimal UI; not
   affiliated with Minimal UI or MUI SAS" safe nominative use, or should we avoid naming the kit at
   all after L4?
6. **Trademark.** Run a clearance search for "Owlky" (USPTO, EUIPO, WIPO Global Brand Database,
   the Vietnam IP Office) in classes 9 and 42. Nearby marks to consider: "Owly" (Hootsuite),
   "Owlka". Should the owner register it, and in which jurisdictions?
7. **Notices format.** Is one `THIRD_PARTY_NOTICES` file per npm package (plus one inside
   `dist/monaco/`) enough for the BSD-2, BSD-3 and Apache-2.0 duties for CDN users who load the
   files directly? Or must the bundles also carry a short header that points to it?
8. **Codicon font** (R14): if the icons are CC BY 4.0, is a notice in the package enough, given
   that the font is inlined in `monaco.css` and users never see the notice?
9. **ApexCharts family.** ApexCharts (not MIT since v4) and ApexGantt (commercial) were used as
   behavior and API references only, and their demo data will be replaced (C5). Is there any
   remaining risk in matching their option names?

## What this assessment could not determine

- **The paid kit's source.** No values could be compared with the paid kit's files. "Paid kit
  only" means "the repository says it came from the reference, and it is not in the free MIT
  repository". T3, T4, T6, T10 and T12 were not confirmed against a second public source.
- **The free kit's component overrides** (button, chip, label CSS) were not compared value by
  value: one fetch failed (404). T15's split between free-kit and paid-only details is therefore an
  estimate.
- **Lucide** is not installed. The Lucide-identical icon paths (I5) were recognized by eye, not by
  an automated comparison.
- **Codicon license version** inside Monaco 0.57 (R14), and whether the Next.js build of the
  website keeps license comments (D7): not checked.
- **Picker locale strings** (C11): not compared with MUI X.
- **The video** (I4): its origin isn't recorded anywhere.
- **Trademark status** of "Owlky": only a web search was run (no product found). That is not a
  clearance search.
- Third-party code inside **`node_modules` of the website build output** (`apps/website/out`) was
  not inventoried package by package; D7 and D9 cover the known runtimes.
