# Component specifications

The contract both implementations follow. Write or update the spec **before** code.
Specs live in `specs/components/<name>.md` (the folder is created with the first spec; the
previous Button/Switch/Dialog specs are at commit `bd5fb2d`, ADR-0011).

Template (copy for a new component):

```md
# <Name>

Reference: Minimal UI kit "<Page>" page, sections … (content only).
Reference URL: <the exact URL given to `/component`>

## Purpose

## Anatomy            element tree with data-ok-* attributes (identical in React and HTML)

## Options            attribute ↔ React prop ↔ default

## States             native/ARIA attributes that drive styling

## Behavior           what happens on each interaction; runtime needed?

## Keyboard           key → action

## Accessibility      roles, names, descriptions, focus management

## Events / API       HTML events + instance API; React callbacks

## Parity notes       intentional differences (if any)
```

Every spec records its **Reference URL** (the page passed to `/component`), so later updates and
integrations re-fetch the same reference instead of working from memory.

## Foundations references
Foundations have no spec; their reference pages:

- Colors: https://minimals.cc/components/foundation/colors
- Typography: https://minimals.cc/components/foundation/typography
- Shadows: https://minimals.cc/components/foundation/shadows
- Grid: https://minimals.cc/components/foundation/grid
- Icons: https://minimals.cc/components/foundation/icons
- Settings: the Settings drawer (header settings button) of the reference site — no own page
