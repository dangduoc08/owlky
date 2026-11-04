# Dialog

## Purpose

Modal dialog that interrupts the page for a decision or a focused task.

## Anatomy

```
[trigger] button[aria-haspopup="dialog"]                       HTML: [data-mt-dialog-open="<id>"]
dialog[data-mt-dialog][data-mt-size][aria-labelledby][aria-describedby]?   React: + data-mt-runtime="off"
  (div|form)[data-mt-dialog-content]
    h2[data-mt-dialog-title]#<title-id>
    div[data-mt-dialog-body] › p#<description-id>?
    div[data-mt-dialog-actions] › buttons                      HTML close: [data-mt-dialog-close]
```
The `<dialog>` is a transparent full-viewport container; the content is the paper. A click whose
target is the `<dialog>` itself is a backdrop click.

## Options

| HTML                                                                 | React                          | Default         |
| -------------------------------------------------------------------- | ------------------------------ | --------------- |
| `data-mt-size` = `xs` 444 · `sm` 600 · `md` 900 · `lg` 1200 · `full` | `<DialogContent size>`         | `sm`            |
| `data-mt-escape-close="false"`                                       | `closeOnEscape={false}`        | Escape closes   |
| `data-mt-backdrop-close="false"`                                     | `closeOnBackdropClick={false}` | backdrop closes |
| `data-mt-open`                                                       | `defaultOpen` / `open`         | closed          |

## Behavior (`core` `createDialogController`)

- **Open:** `showModal()` (fallback: ADR-0006); push onto the page layer stack; lock page scroll
  (reference-counted); focus `[autofocus]` → first tabbable → content.
- **Dismiss requests** (Escape, backdrop) are reported, not acted on: React updates state
  (controlled dialogs may refuse); HTML emits cancelable `beforeclose`. Only the topmost layer reacts.
- **Close:** close the dialog, release lock and stack, return focus to the trigger (passed
  explicitly — Safari doesn't focus buttons on click) if focus was lost.
- **External close** (`<form method="dialog">`, uncancelable platform request): state syncs.
- **Removal / unmount while open:** cleanup without focus restoration.

## Keyboard

`Tab`/`Shift+Tab` stay within the dialog (native modals may hand focus to browser UI);
`Escape` requests close.

## Accessibility

Role `dialog`, modal; name via `aria-labelledby` (React wires it when `DialogTitle` is rendered),
description via `aria-describedby` (`DialogDescription`). Background inert. Focus returns to the trigger.

## Events / API

HTML: `mt:dialog:beforeopen` (cancelable) · `mt:dialog:open` · `mt:dialog:beforeclose`
(cancelable, `detail.reason`) · `mt:dialog:close` (`reason`: `escape` `backdrop` `trigger` `api`
`native`). Instance: `open(trigger?)`, `close(reason?)`, `toggle()`, `isOpen`.
React: `<Dialog open defaultOpen onOpenChange>`, `DialogTrigger`, `DialogContent`, `DialogTitle`,
`DialogDescription`, `DialogBody`, `DialogActions`, `DialogClose`.

## Parity notes

Behavior hooks (`data-mt-dialog-open/close`, `data-mt-*-close` options) exist only in HTML;
React uses handlers/props. Everything else is identical (verified by `e2e/tests/parity.spec.ts`).
