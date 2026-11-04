# Component specifications

The contract both implementations follow. Write or update the spec **before** code.
Specs live in `specs/components/<name>.md` (the folder is created with the first spec; the
previous Button/Switch/Dialog specs are at commit `bd5fb2d`, ADR-0011).

Template (copy for a new component):

```md
# <Name>

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
