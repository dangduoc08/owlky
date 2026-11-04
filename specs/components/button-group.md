# Button group

Reference: Minimal UI kit "Buttons" page, section "Button group" (content only). Created with `/component`.

## Purpose
Joins related Buttons into one control (segmented actions).

## Anatomy
```
div[role="group"][data-mt-button-group][data-mt-orientation][aria-label]?
  (button|a)[data-mt-button]…        regular Buttons (see button.md), one per action
```

## Options
| HTML | React | Values | Default |
|---|---|---|---|
| `data-mt-orientation` | `orientation` | `horizontal` `vertical` | `horizontal` |
| on each button | `variant` `color` `size` `disabled` | as Button; React passes the group's values to every child Button (a child prop wins) | Button defaults |

## States
The group only joins its children: outer corners rounded, inner corners square; a 1px separator
between buttons (contained: `dark` 48 %, neutral grey 32 %; text: `channel` 48 % / 32 %; soft:
`dark` 24 %; disabled: `--mt-action-disabled-bg`); outlined buttons share borders. Contained
buttons have no hover shadow inside a group. A focused button is raised above its neighbours.

## Behavior
CSS only, no runtime.

## Keyboard
Native: `Tab` moves through the buttons; `Enter` / `Space` activate.

## Accessibility
`role="group"`; give it an `aria-label` when the buttons need a shared context.

## Responsive
The group doesn't wrap: use `vertical` (or fewer buttons) on narrow screens.

## Parity notes
In HTML, write `data-mt-variant` / `data-mt-color` / `data-mt-size` on every button (React does it
from the group's props).
