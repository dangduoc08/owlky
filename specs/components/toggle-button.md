# Toggle button

Reference: Minimal UI kit "Buttons" page, section "Toggle button" (content only). Created with `/component`.

## Purpose
A button that stays pressed (format text, choose a view). Standalone, or in a group with
exclusive (one) or multiple selection.

## Anatomy
```
div[role="group"][data-mt-toggle-group][data-mt-orientation][data-mt-exclusive]?[aria-label]
  button[type="button"][data-mt-toggle-button][data-mt-color][data-mt-size][value][aria-pressed]…
    svg[aria-hidden="true"] | text

button[type="button"][data-mt-toggle-button]…[aria-pressed]      (standalone)
```

## Options
| HTML | React | Values | Default |
|---|---|---|---|
| `data-mt-color` | `color` | `inherit` `primary` `secondary` `info` `success` `warning` `error` | `inherit` |
| `data-mt-size` | `size` | standalone `sm` 40 · `md` 48 · `lg` 56; in a group `sm` 30 · `md` 38 · `lg` 46 | `md` |
| `aria-pressed` | `selected` / `defaultSelected` (standalone) | `true` `false` | `false` |
| `value` | `value` | string identifying the button in a group | — |
| `data-mt-exclusive` | `exclusive` | group: at most one pressed button | off |
| `data-mt-orientation` | `orientation` | `horizontal` `vertical` | `horizontal` |
| group value | `value` / `defaultValue` / `onChange` | exclusive: `string \| null`; multiple: `string[]` | `null` / `[]` |

React passes the group's `color`, `size` and `disabled` to every child (a child prop wins).

## States
- Unpressed: secondary text color. Pressed: bg `channel` 8 % and `main` text (inherit:
  `--mt-action-selected`, primary text); standalone pressed buttons also get a `currentColor` border.
- Standalone: 1px border (grey 20 %). Group: 1px border (grey 16 %), 4px padding and gap; buttons inside
  have no border.
- `:hover` (`hover: hover`): `--mt-action-hover` (colored: `channel` 8 %). `:disabled`:
  `--mt-action-disabled` text; pressed + disabled: `--mt-action-disabled-bg` fill.

## Behavior
Runtime needed in HTML (React keeps state). Selection logic is shared in core
(`nextToggleSelection()`): exclusive → pressing the pressed button clears the selection, any other
replaces it; multiple → adds or removes the value. Disabled buttons never change.

## Keyboard
Native buttons: `Tab` to each button, `Enter` / `Space` toggle.

## Accessibility
`aria-pressed` carries the state; the group is `role="group"` (add `aria-label`). Icon-only buttons
need `aria-label`.

## Events / API
HTML, cancelable (call `preventDefault()` to keep the current state):
- `mt:toggle-button:change` on a standalone button — `detail: { pressed }` (the new state).
- `mt:toggle-group:change` on the group — `detail: { value, previous, button }` (`value` shaped as
  in the options table).

Instances: `runtime.get(el, "toggle-button")` → `{ pressed, setPressed(pressed) }`;
`runtime.get(el, "toggle-group")` → `{ value, setValue(value) }` (setters don't emit events).
React: `onChange(selected)` on a standalone `ToggleButton`, `onChange(value)` on `ToggleButtonGroup`;
both work controlled and uncontrolled.

## Responsive
Same size at every breakpoint; use `vertical` for narrow screens.

## Parity notes
React renders `data-mt-runtime="off"` on the group and on standalone buttons.
