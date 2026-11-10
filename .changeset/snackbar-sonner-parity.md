---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Snackbar: Sonner's remaining API.

- Swipe to dismiss toward the toaster's edges (`swipeDirections`; HTML `data-ok-swipe-directions`, empty to turn it off). Swipeable toasts now show a close button by default (the single-pointer path, WCAG 2.5.7); `closeButton={false}` hides it.
- `expand={false}` stacks the toasts (HTML `data-ok-expand="false"`); hover, focus or the `hotkey` (Alt + T, HTML `data-ok-hotkey`) expand them. The default stays expanded, like before.
- `richColors`, `invert` (Toaster and per toast), `offset` / `mobileOffset` / `gap`, per-toast `position` (a list of its own), per-toast `closeButton`, Toaster `toastOptions` and `icons`, several toasters (Toaster `id` + toast `toasterId`; HTML trigger `data-ok-toast-toaster`), right to left (`dir`, logical properties in the toast).
- `toast.promise` takes toast options and `finally`, and returns the id boxed with `unwrap()` like Sonner: compare it with `id.valueOf()`. `toast.getHistory()`, `toast.getToasts()`, `useSonner()`; HTML instance `getToasts()` / `getHistory()`, `promise` `finally` / `description`, `ok:toaster:dismiss` reason `swipe`.
- Centered toasters are placed with `margin-inline: auto` instead of a transform.
