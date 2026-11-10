---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Sortable: auto scroll, disabled items, drag events and HTML announcement texts. While a pointer drag is near the edge of a scroll area (such as the Scrollbar around a list) or of the window, it scrolls, faster closer to the edge; turn it off with `autoScroll={false}` (`data-ok-auto-scroll="false"`). Disabled items (React `isItemDisabled`, HTML `data-ok-disabled` on the item and `disabled` on its handle) can't move and other items never take their place. `onDragStart`, `onDragOver`, `onDragEnd` and `onDragCancel` (React, `{ item, index, list }`; they replace the list element's native HTML drag handlers of the same names) and `ok:sortable:dragstart` / `dragover` / `dragend` / `dragcancel` (HTML) follow every drag, keyboard move and tap. HTML lists translate their announcements with `data-ok-message-grabbed`, `-moved`, `-moved-to-list`, `-dropped`, `-cancelled` and `-removed` (`{position}`, `{total}`, `{list}`). Fix: a pointer drag released outside its handle no longer swallows the next click on a handle. New Disabled items story.
