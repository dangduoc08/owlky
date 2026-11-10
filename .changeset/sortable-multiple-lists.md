---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Sortable: move items between lists (ADR-0053). Lists with the same `group` (`data-ok-group`) exchange items, and `accept` (`data-ok-accept`) names the groups a list takes items from. Items move by dragging (onto an item or into an empty list, which keeps a drop target's height), with the keyboard (Left / Right arrow in vertical lists, Up / Down arrow in horizontal lists, past the ends in grids; the focus stays on the moved item), with two taps, or with a `data-ok-sortable-move-to="<list id>"` control inside an item, such as a "Move to" menu. Moves are announced with the list's name (new `movedToList` message; every message gets the list's name as a third argument). React adds `group`, `accept`, `onTransfer({ item, from, to, fromIndex, index })` and the `moveBetweenLists(lists, event)` helper; HTML adds the cancelable `ok:sortable:transfer` event and the `transfer(index, to, toIndex?)` instance method. Pointer drags now listen on the document while they last. New Kanban story.
