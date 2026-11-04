# Switch

## Purpose

Toggle a single setting on/off with immediate effect.

## Anatomy

```
label[data-mt-switch][data-mt-color][data-mt-size]
  input[type="checkbox"][role="switch"][data-mt-switch-input]
  span[data-mt-switch-track][aria-hidden="true"] › span[data-mt-switch-thumb]
  span[data-mt-switch-label]?
```
The input is transparent and covers the whole label, so it receives every click natively.

## Options

| Attribute        | React prop                                                                      | Values                                                   | Default   |
| ---------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------- | --------- |
| `data-mt-color`  | `color`                                                                         | `primary` `secondary` `info` `success` `warning` `error` | `primary` |
| `data-mt-size`   | `size`                                                                          | `sm` `md`                                                | `md`      |
| input attributes | `checked` / `defaultChecked`, `disabled`, `name`, `value`, `required`, `aria-*` | native                                                   | —         |
| label text       | `label`                                                                         | ReactNode                                                | —         |

React: `ref`, input props → `<input>`; `className`, `style` → root `<label>`.
`onCheckedChange(checked)` plus native `onChange`.

## States

`:checked`, `:disabled`, `:focus-visible` on the input (styled through the sibling track); RTL via `:dir(rtl)`.

## Behavior

Native checkbox. **No runtime.**

## Keyboard

`Space` toggles. `Tab` focuses.

## Accessibility

Role `switch` with checked state; name from the visible label or `aria-label`. Focus ring on the
track. Disabled: dimmed track, disabled text color, `not-allowed` cursor.
