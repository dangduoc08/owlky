# ADR-0053: Sortable — moving items between lists

**Status:** Accepted (2026-11-10). Extends the Sortable as created with `/component`
(`specs/components/sortable.md`, no earlier ADR): one controller per list, intent reported to the
owner (ADR-0004), the owner applies it.

## Context
Roadmap row 4.18.75 (audit 3.1) asks for moving items between lists (kanban boards), with the
keyboard, announcements and a single-pointer alternative (WCAG 2.2, 2.5.7). Upstream is dnd-kit
(`@dnd-kit/react` `useSortable` and the "Multiple sortable lists" guide, checked 2026-11-10):
items carry `group` (the list they sort in), `type` and `accept` (which types a target takes);
columns are droppables so empty ones still take items; `onDragOver` moves items between columns
with the `move(items, event)` helper; a cancel restores a snapshot. dnd-kit has one provider
(`DragDropProvider`) around every list. Owlky has no provider: each `ul[data-ok-sortable]` has
its own controller, and React lists own their items while HTML lists are the DOM itself.

## Decision
1. **Groups are list attributes.** `data-ok-group="<name>"` connects lists: an item may leave a
   list for another list of the page whose group matches. `data-ok-accept="<names>"`
   (space-separated) narrows or widens what a list takes: when present, the list takes items from
   lists whose group is in it (one-way boards: a "Done" list with `accept="tasks"` and its own
   group); when absent, it takes its own group. A list without a group never gives or takes.
   React writes the same attributes from `group` / `accept` (string or string array), so core
   reads one source (the DOM) on every step. dnd-kit's per-item `type` is not offered (lists hold
   one kind of item); its `accept` predicate is deferred (HTML can't express it).
2. **A module-scoped registry, one session per document.** Every controller registers its list
   in a module-scoped `Map<Document, Set<entry>>` (no global, ADR-0007). The grab or drag in
   progress is one session per document (one focus, one primary pointer): the item, the list
   holding it and its start (list, index). Any controller of the group continues it: keys go to
   the controller of the list whose handle is focused, the pointer drag listens on the document
   for its duration. Every intent goes to the owner of the list **holding** the item, which knows
   its data (React) or is that DOM (HTML).
3. **The intent.** Within a list: `onMove(from, to)` as before. Across lists: `onTransfer({ item,
   from, to, index })` — the item's element, the source and target lists, the index in the target
   (plus `fromIndex`, its index in the source, so owners need not look it up) — reported to the source's owner; returning `false` refuses (HTML: `ok:sortable:transfer`
   prevented). React maps it to `onTransfer({ item: T, from, to, fromIndex, index })` with the
   lists' `id`s (a list in a group needs an `id`; React falls back to `useId()`), and exports
   `moveBetweenLists(lists, event)` (dnd-kit's `move` for a record of arrays). A React list
   without `onTransfer` refuses. HTML moves the element itself (`insertBefore` in the target).
4. **The item may come back as a new element.** HTML moves the same node; React unmounts it from
   one list and mounts a new one in the other. After a transfer the session is *pending*: it
   resolves to the same element once it is in the target, or to the target's item at `index`
   once the old one is disconnected; it is dropped (refused) when the item is still in the source
   after eight frames. Resolution runs from a MutationObserver on the target, each pointer move and
   each auto-scroll frame. Meanwhile hit testing waits. A resolved new element gets the session's
   flags back (`data-ok-dragging` + its transform, or `data-ok-grabbed` + `aria-pressed`) and,
   for keys, the focus on its handle.
5. **Pointer targets.** Over an item of an accepting list: that item's index. Over an accepting
   list's own box (its padding, or the Scrollbar whose child it is) but no item: the list's end,
   only for another list (within its own list the pointer must reach an item, as before). Empty
   lists are therefore drop targets as long as they have a size: `sortable.css` gives an empty
   list a minimum block size (`:not(:has(> [data-ok-sortable-item]))`), like dnd-kit's droppable
   columns.
6. **Keys.** Lists of a group are ordered as in the document. Vertical lists move to the previous
   / next accepting list with ←/→ (keeping the index, clamped), horizontal lists with ↑/↓, grids
   when ← / → go past the first / last item (to the previous list's end, the next list's start).
   The focus stays on the moved item's handle; Escape brings it back to its start list and
   index; focus leaving the list holding the item drops it.
7. **Announcements.** One polite live region per document (as before). Every message gets the
   list's name (`aria-label`) as a third argument; a move to another list says
   `movedToList(position, total, list)` ("Moved to Done, position 1 of 3.").
8. **Single-pointer alternative.** Two taps already work across lists (tap a handle, then a
   handle in another list). For empty lists and screen reader touch users, any element with
   `data-ok-sortable-move-to="<list id>"` inside an item moves that item to the end of that list
   when clicked, through the same transfer intent, announced and with the focus on the moved
   item. The kanban story composes it in a **Menu** per card ("Move to …"), the pattern
   accessibility guidelines for boards recommend.

## Consequences
- HTML and React lists can't be mixed in one group (an HTML owner can't create a React item);
  documented.
- Owners that apply transfers late (more than eight frames) lose the drag's tracking: the item
  lands, the drag ends. Owners apply them in the same task in practice (React commits discrete
  and continuous updates before the next frame).
- Instances gain `transfer(index, to, toIndex?)` (HTML); React needs only state.
- Deferred: item `type` / `accept` predicates, moving whole lists (column reordering), copying
  (SortableJS `pull: "clone"`).
