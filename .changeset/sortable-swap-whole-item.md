---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Sortable: swapping strategy and drags from the whole item. New option `strategy` (`"sort"` · `"swap"`, `data-ok-strategy="swap"`): the moved item and the one it is dropped on trade places, previewed with `data-ok-swap-target` while dragging or choosing a target with the arrow keys; taps on two handles swap too, Escape cancels. React `onReorder` gets the swapped items (`arraySwap(items, from, to)`, exported from core and React); HTML fires the cancelable `ok:sortable:swap` (`{ from, to, item, target }`) and the instance gets `swap(from, to)`. New option `activator` (`"handle"` · `"item"`, `data-ok-activator="item"`): a pointer drag starts anywhere on an item except the controls inside it; the handle stays for the keyboard and taps. Core: controller option `onSwap(from, to)`, `sortableStrategies`, `sortableActivators`, `SortableStrategy`, `SortableActivator`.
