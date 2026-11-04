# Button

## Purpose

Trigger an action. Links that look like buttons use the same anatomy on `<a href>`.

## Anatomy

```
button[type="button"][data-mt-button][data-mt-variant][data-mt-color][data-mt-size][data-mt-full-width]?
  span[data-mt-button-icon="start"][aria-hidden="true"]?  › svg
  text
  span[data-mt-button-icon="end"][aria-hidden="true"]?    › svg
```

## Options

| Attribute            | React prop             | Values                                                             | Default   |
| -------------------- | ---------------------- | ------------------------------------------------------------------ | --------- |
| `data-mt-variant`    | `variant`              | `contained` `outlined` `soft` `text`                               | `text`    |
| `data-mt-color`      | `color`                | `inherit` `primary` `secondary` `info` `success` `warning` `error` | `inherit` |
| `data-mt-size`       | `size`                 | `sm` (30px) `md` (36px) `lg` (48px)                                | `md`      |
| `data-mt-full-width` | `fullWidth`            | boolean                                                            | off       |
| icon wrappers        | `startIcon`, `endIcon` | ReactNode                                                          | —         |

React always renders defaults explicitly (from `buttonAttributes()`); CSS treats a missing
attribute as the default.

## States

`:hover` (only `@media (hover: hover)`), `:focus-visible` (2px outline, 2px offset),
`:disabled`, `[aria-disabled="true"]`.

## Behavior

None beyond the native element. **No runtime.** React default `type="button"`.

## Keyboard

Native: `Enter` / `Space` activate.

## Accessibility

Accessible name = text content (icons are `aria-hidden`); icon-only buttons need `aria-label`.
`aria-disabled` keeps focusability — the consumer must block the action. Colors meet AA (ADR-0002).
