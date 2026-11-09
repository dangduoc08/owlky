# Illustrations style guide

The visual grammar of `@owlky/core/illustrations` (ADR-0041), measured on the first 16 pictures
(2026-11-09). New pictures follow it so the set stays one family. The shared details come from
the parts in `packages/core/src/illustrations/parts.ts`; the rules marked **(tested)** are enforced
by `packages/core/src/illustrations/style.test.ts`. `/illustration` (`.claude/commands/`) applies
this guide.

## Canvas

- `viewBox="0 0 480 360"` (4:3) for every scene **(tested)**; shapes such as `avatar-shape` have
  their own box and are not scenes (name ends in `-shape`).
- Ground line: y 320. The ground shadow is centered at (240, 320); feet stand at y 314, object
  bases at y 300–320.
- Backdrop box: x 54–424, y 41–320. Keep the hero inside x 80–400, y 40–320.
- Props and sparkles may use the margins. Keep shapes inside the canvas (measured extents: x 3–470,
  y 6–342; only a cloud bank bleeds to the edge).

## Composition

Draw order, back to front:

1. `backdrop()`: one blob, `main` at 8% opacity, always the first node **(tested: exactly one,
   first)**.
2. `groundShadow()`: the `shadow` ellipse 380 × 24 (smaller under a narrow hero:
   `email-sent` uses 280 × 20), before every other shape **(tested: exactly one)**.
3. Back props (a stand, a second sheet, gears), then **one hero object** centered on x 240, then
   front props and at most one person beside it.
4. Sparkles last: 2–6 per scene **(tested)**, at most 4 stars (`sparkle()`, radius 7–14, mostly
   10, 8, 12) and at most 4 dots (`dot()`, radius 3–5) **(tested)**. They sit in the margins,
   around x 60–150 and 340–450, never on the hero.

Exceptions **(tested)**: a sky scene (`coming-soon`) stands on a bank of `cloud()`s on the ground
line instead of a ground shadow. Art composed into a component that paints its own surface
(`upload`, the drop zone) has no backdrop; it is drawn on a 200 × 150 grid inside a `scale(2.4)`
group. Add a new exception to `NO_BACKDROP` in the test only with the same reason.

## Tones

Light comes from the top left. Every object is flat and split along its vertical axis:

| Use | Tone |
|---|---|
| Lit face of the hero (left half or whole) | `main` |
| Shaded face (right half), offset depth copy | `dark` |
| Deepest details (keyholes, inside of a box, plug pins) | `darker` |
| Secondary shapes, side flaps, a second gear, highlights | `light` |
| Lightest fills (facets, icon circles on paper) | `lighter` |
| Stars, flames, barriers, keys, tools, hats | `accent-main`, `accent-light`, `accent-dark` |
| Sheets, screens, boards | `paper` + `outline` (stroke 3) |
| Clouds, pedestals, smoke, form fields | `neutral` |
| Text lines on paper | `line` |
| Dark objects: trousers, shoes, hair, cables, frames, pots | `ink` |
| Metal: stands, posts, shackles, wrenches | `grey-600` (`grey-500` for small dots on paper) |
| Icons on a brand fill (check, lock, shield mark) | `white` |
| Neck shadow, toolbox band | `shade` |
| Skin, only inside `person()` **(tested)** | `skin-light`, `skin-medium`, `skin-deep` |

- Accent tones: at most 30% of the shapes **(tested; measured 0–26%)**. Brand tones: at least 20%
  **(tested; measured 22–67%)**, so the `color` option recolors the picture.
- Only the tones of `illustrationTones`; no colors, ids, references or styles **(tested)**.

## Strokes, corners, perspective

- Caps and joins are always round (the stylesheet). No hairlines: effective width ≥ 2, after group
  scales **(tested)**.
- Widths: outlines of paper 3 **(tested: 2–3 effective)**; text lines 6 (8–10 on large cards);
  sparks, arrows and chart lines 5–6; cables, bag handles and keys 6–12; check marks 7–12; arms 10
  with sleeves 14; legs 17; heavy
  rings, shackles and handles 18–22; big glyphs (404, 500) 26–28.
- Corner radii: confetti, bars and keyholes 2–4; widgets and plugs 6–8; sheets, cards and boards
  8–16; devices and lock bodies 18–24 (`screen()`: the screen is 8 less than the frame); pills
  (a digit 0) half the width.
- Flat front view. No gradients, filters, masks, clip paths or text (the element allowlist).
  Opacity only for the backdrop (0.08), glass (0.12) and a soft highlight (0.6). Depth comes from
  the two-tone split or a `dark` copy offset by (7, 7).

## People

Use `person({ x, pose, skin, shirt, hair })`; never redraw a person.

- Front view, standing on the ground line. Head radius 18 (36 across); about 6 heads from the
  top of the hair (y 102–107) to the shoes (y 320).
- Neck 12 × 16 with a `shade` band; torso 58 wide tapering to 48; legs and shoes `ink`; sleeves in
  the `shirt` brand tone; hands are skin circles of radius 6.
- Poses: `point` (the right hand forward at shoulder height, holding a tool or pointing at the
  hero) and `wave` (raised). Hair: `short`, `bun`, `long` (`ink`).
- One person per scene, beside the hero (x 130–170 measured). Vary skin tones across the set
  (each one is used once so far) and the shirt tone (`main`, `light`, `dark`).
- Props worn or held (a hard hat, a wrench) are the picture's own nodes, drawn after the person.

## Level of detail

- 15–40 nodes per scene; at most 48 **(tested)**.
- About 0.7–1.6 kB gzip for one picture with its parts; at most 3 kB, and the bundle of one
  picture holds no other picture (`pnpm check:size`).
- Repeated small shapes (stripes, bullets) come from a local helper in the data file.

## Naming

- File `packages/core/src/illustrations/data/<name>.ts`, export `camelCase` of the name, `name`
  in kebab-case (the file name), one-line JSDoc: `<Title>: <what it shows>. Original artwork (MIT).`
- Original artwork only: no tracing or copying of third-party illustrations.

## Checklist for a new picture

1. Pick the hero object and the props; reuse parts (`backdrop`, `groundShadow`, `sparkle`, `dot`,
   `cloud`, `plant`, `lines`, `paper`, `screen`, `person`). A detail that two pictures share
   becomes a part.
2. Draw in the order above, on the 480 × 360 canvas, tones from the table.
3. `pnpm build && pnpm test packages/core/src/illustrations` (rules), then the catalog steps in
   AGENTS.md (export, `illustrations` list, story group, snippets, docs count, size check).
4. Look at the **All** story (Foundations › Illustrations) in light and dark and at phone width
   next to the others: same blob, shadow, stroke weight and palette balance.
