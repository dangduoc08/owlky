# ADR-0069: Owlky's own visual identity (color foundation and font)

**Status:** Accepted (owner's decisions 2026-11-12, track 2 "Clean IP and own identity", step L3).
Supersedes ADR-0014 (brand colors follow the reference) and the reference-derived default values
of the theme (palette, presets, dark scheme, font presets, motion timings) chosen in phases 1 and
2'. ADR-0017's mechanism (presets and fonts as data attributes) stays.

## Context
The L1 / L2 audit (`docs/legal/inventory.md`, `assessment.md`) found that the default theme
reproduces the Minimal template's values: the green primary `#00A76F`, its five presets, its dark
scheme, Public Sans + Barlow and the font preset list, and its motion timings are only in the paid
kit; the grey scale, the status palettes, the custom shadows and the type scale are also in
Minimal's free MIT edition. The owner never bought or downloaded the kit and wants Owlky to be a
clean asset of their own, changing mainly the color foundation and the font, with every color
pair at WCAG AA (no brand-text exemption any more).

## Decision
1. **Palette source: Tailwind CSS v4's color palette** (MIT, OKLCH values in
   `tailwindcss/theme.css`). `THIRD_PARTY_NOTICES` carries Tailwind Labs' MIT notice. Owlky takes
   the values, not Tailwind Plus designs.
2. **Default: Indigo with Zinc greys.** Primary = Tailwind `indigo`; neutrals = `zinc`.
3. **Status colors:** success `green`, warning `amber`, error `red`, info `sky`; secondary
   `violet`.
4. **Primary presets** (`data-ok-preset`, names are the hue names): `indigo` (default), `teal`,
   `violet`, `sky`, `rose`, `amber`. The old preset names (`cyan`, `purple`, `blue`, `orange`,
   `red`) are removed; a pre-0.1.0 minor change with a migration note.
5. **Role mapping per color** (`lighter`, `light`, `main`, `dark`, `darker`, `contrastText` and the
   text tones): chosen from the color's 11 steps by a generator in `packages/tokens`, never by
   hand: `main` is the first of 500 → 800 on which white text reaches 4.5:1 (so `contrastText` is
   always white, or pure black where no step passes); `lighter` 100, `light` 300, `dark` one step
   above `main`, `darker` 900; light-mode text tone = the first of 600 → 800 at 4.5:1 on paper;
   dark-mode text tone = the first of 400 → 200 at 4.5:1 on the dark paper; soft fills `100`
   (light) / `900` (dark) with a soft text tone at 4.5:1 on them. Tests assert every pair.
6. **Dark scheme** from the same neutral scale: background `zinc-950`, paper `zinc-900`, dividers
   `zinc-800`, text primary `zinc-50`, secondary the first of 400 → 300 at 4.5:1 on paper. Shadow
   color stays a token (`--ok-shadow-color`).
7. **AA everywhere:** ADR-0014's exemption ends. Contained, outlined, text and soft variants,
   Labels, Chips, swatches and Typography palette colors all meet 4.5:1 for text and 3:1 for
   control borders and focus rings; `CONTRAST_EXEMPT` keeps only inactive (disabled) parts, as
   WCAG allows.
8. **Font: Be Vietnam Pro** (SIL OFL 1.1) for text and headings (`--ok-font-family` and
   `--ok-font-family-secondary` both point to it); monospace stays the system stack. Owlky still
   doesn't bundle fonts. Font presets (`data-ok-font`): `be-vietnam-pro` (default), `inter`,
   `plus-jakarta-sans`, `geist`; all OFL. Designers, license and the `tnum` / Vietnamese coverage
   are verified from the font files before L4 lands.
9. **Kept from the free MIT edition, with its notice** (owner: change mainly color and font):
   the custom shadow scale and the type scale. `THIRD_PARTY_NOTICES` credits "Copyright (c) 2021
   Minimal UI" (MIT) for them. Motion timings and easings are paid-kit values and are replaced by
   Owlky's own (L4).
10. **Signature details** recorded from the paid demo pages (about 95 CSS lines that cite the
    reference: soft-variant tints, Label metrics, the skins of Upload, Editor, Carousel, Lightbox,
    Walktour, Organization chart, pickers, data grid) are reviewed one by one with the owner in
    L4; this ADR doesn't decide them.

## Consequences
- Every snippet, story and docs page keeps its markup; colors and fonts change through tokens.
  Pixel baselines change everywhere: regenerated in Docker after L4 (visual specs), parity is
  unaffected (both sides read the same tokens).
- `createTheme()` keeps its API; its defaults come from the new tokens.
- Illustrations follow automatically (tones map to tokens, ADR-0041).
- The README's "uses none of its code or assets" sentence is corrected in L5.
