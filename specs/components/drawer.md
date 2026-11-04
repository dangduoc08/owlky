# Drawer

Reference: Minimal UI kit "Drawer" page, section "Anchor" (content only). Created with `/component`.

## Purpose
A modal panel that slides in from an edge of the screen (navigation, filters, details).

## Anatomy
```
[trigger] button[data-mt-button][aria-haspopup="dialog"]     HTML: [data-mt-drawer-open="<id>"]
dialog[data-mt-drawer][data-mt-anchor][aria-label | aria-labelledby]   React: + data-mt-runtime="off"
  div[data-mt-drawer-content]                                the paper; any content
    … HTML close: [data-mt-drawer-close] (inside) or [data-mt-drawer-close="<id>"]
```
The `<dialog>` is a transparent full-viewport container; the content is the paper. A click whose
target is the `<dialog>` itself is a backdrop click.

## Options
| HTML | React | Values | Default |
|---|---|---|---|
| `data-mt-anchor` | `<DrawerContent anchor>` | `left` `right` `top` `bottom` | `left` |
| `data-mt-escape-close="false"` | `closeOnEscape={false}` | | Escape closes |
| `data-mt-backdrop-close="false"` | `closeOnBackdropClick={false}` | | backdrop closes |
| `data-mt-open` | `defaultOpen` / `open` + `onOpenChange` | | closed |

## Layout and tokens
- Paper `--mt-bg-paper`, text `--mt-text-primary`; backdrop `--mt-backdrop`; stacking `--mt-z-modal`
  (fallback path).
- `left` / `right`: full height, width from the content, at most `100% - 56px`; shadow
  `--mt-shadow-dialog-start` (left) / `--mt-shadow-dialog` (right).
- `top` / `bottom`: full width, height from the content, at most `100% - 56px`; shadow
  `--mt-shadow-z16`. Content scrolls inside the paper when it is taller.
- Opening slides the paper in from its edge and fades the backdrop (`--mt-duration-short`,
  `--mt-easing-decelerate`) where `@starting-style` is supported; closing is immediate.
  `prefers-reduced-motion` disables both.

## Behavior (`core` `createModalController`)
- **Open:** `showModal()` (fallback: `open` + `data-mt-fallback`, siblings inert, ADR-0006); push onto
  the layer stack; lock page scroll; focus `[autofocus]` → first tabbable → content.
- **Dismiss requests** (Escape, backdrop) are reported, not acted on: React updates state (controlled
  drawers may refuse); HTML emits cancelable `beforeclose`. Only the topmost layer reacts.
- **Close:** release lock and stack; focus returns to the trigger if focus was lost.
- **External close** (`<form method="dialog">`): state syncs. **Removal / unmount while open:**
  cleanup without focus restoration.

## Keyboard
`Tab` / `Shift+Tab` stay inside the drawer (native modals may hand focus to browser UI); `Escape`
requests close.

## Accessibility
Role `dialog`, modal. A name is required (`aria-label` or `aria-labelledby`). Background inert.
Focus returns to the trigger. Triggers carry `aria-haspopup="dialog"`.

## Events / API
HTML: `mt:drawer:beforeopen` (cancelable) · `mt:drawer:open` · `mt:drawer:beforeclose`
(cancelable, `detail.reason`) · `mt:drawer:close` (`reason`: `escape` `backdrop` `trigger` `api`
`native`). Instance (`runtime.get(el, "drawer")`): `open(trigger?)`, `close(reason?)`, `toggle()`,
`isOpen`. React: `<Drawer open defaultOpen onOpenChange>`, `DrawerTrigger`, `DrawerContent`,
`DrawerClose`.

## Responsive
Same anchors at every breakpoint. The `56px` gap keeps the backdrop reachable on small screens.

## Parity notes
Behavior hooks (`data-mt-drawer-open/close`, `data-mt-*-close` options, `data-mt-open`) exist only in
HTML; React expresses them as props and handlers.
