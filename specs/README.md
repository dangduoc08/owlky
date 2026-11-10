# Component specifications

The contract both implementations follow. Write or update the spec **before** code.
Specs live in `specs/components/<name>.md`, one per component family (`motion.md` also covers
CountUp and MotionBorder, `date-picker.md` the fields and calendars, `table.md` TablePagination).

Template (copy for a new component):

```md
# <Name>

Reference: Minimal UI kit "<Page>" page, sections … (content only).
Reference URL: <the exact URL given to `/component`>

## Purpose

## Anatomy            element tree with data-ok-* attributes (identical in React and HTML);
                     every name is also declared in core/src/anatomy/parts.ts (ADR-0049)

## Options            generated: <!-- options:<schema> --> … <!-- /options:<schema> -->
                     (`pnpm specs:options`, AGENTS.md checklist step 1); props and
                     attributes outside the schema below the markers

## States             native/ARIA attributes that drive styling

## Behavior           what happens on each interaction; runtime needed?

## Keyboard           key → action

## Accessibility      roles, names, descriptions, focus management

## Events / API       HTML events + instance API; React callbacks. Keep in step with the
                     runtime's event map (EventSpec) and instance interface, which the
                     generated API reference reads (ADR-0049)

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
