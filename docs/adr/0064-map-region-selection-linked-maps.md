# ADR-0064: Map region selection: multiple regions, Shift + drag box selection, linked maps

**Status:** Accepted (2026-11-11, auto-approved under the roadmap's autorun). Extends ADR-0025
and the choropleth of roadmap 4.18.15; nothing is superseded.

## Context
Roadmap 4.18.98 (batch E, from the 6.0 ApexMaps audit) asks for ApexMaps' selection sample:
`interaction.selection: { multiple, rectangle, modifier: 'shift' }` (Shift + drag selects the
regions whose label anchor is in the box, Alt adds to the selection, Escape abandons the drag),
`states.muted.opacity`, and linked maps (`link: { group, filter: 'bidirectional' | 'emit' |
'receive' }`). Owlky's `MapRegions` (4.18.15) selects one region at a time from a click or its
keyboard listbox. Shift + drag already means something in MapLibre: `boxZoom` zooms to the box.
Dragging must also have a single-pointer and a keyboard alternative (WCAG 2.5.7), and linked
maps need shared state that outlives the gesture, like the chart crossfilter of ADR-0054.

## Decision
1. **Options on `MapRegions`** (`[data-ok-map-regions]`): `multiple` (`data-ok-multiple`) keeps a
   set of selected regions; `boxSelect` (`data-ok-box-select`, ApexMaps `rectangle`) turns on Shift
   + drag and implies `multiple`. Without them the single selection of 4.18.15 is unchanged.
2. **Multiple selection.** A click toggles the region under the pointer; the listbox gets
   `aria-multiselectable="true"`; Enter / Space toggle the active option, Shift + arrows move and
   add the next region, Ctrl / Cmd + A selects every region and Escape clears the set. These keys
   are the keyboard path for everything a box does.
3. **Box selection.** A Shift + primary-button drag on the map view draws
   `div[data-ok-map-selection-box]` (created by the controller while the drag lasts, `aria-hidden`,
   positioned through CSSOM) and, on release, selects the regions whose **label anchor** is inside
   the box: the area-weighted centroid of the largest polygon of the region's features in the
   source (`querySourceFeatures`, lng / lat, projected on release). Without Alt the box replaces the
   selection; with Alt it adds to it. Escape during the drag abandons it; a drag shorter than 4px
   is a click.
4. **`boxZoom` conflict.** While any `MapRegions` of a map has `boxSelect`, the controller disables
   MapLibre's `boxZoom` handler (the root's `boxZoom` setting is restored when no region group asks
   for box selection) and suspends `dragPan` for the drag. Shift + drag never zooms on such a map.
5. **Events.** `ok:map:regionselect` keeps `{ id }` (the region toggled, `null` when cleared) and
   adds `ids` (every selected id in row order); React `onRegionSelect({ id, ids })`. A box or a
   select-all reports once with `id` set to the last region added.
6. **Linked maps.** `group` (`data-ok-group`) puts region groups of any map of the page in a
   module-scoped registry (per library copy, ADR-0007 / ADR-0031). `linkFilter` (`data-ok-link-filter`:
   `bidirectional` default, `emit`, `receive`) says whether a group's selection becomes the
   group's filter and whether it shows other members' filters. The filter is the source's selected
   ids (strings); a new selection replaces it, a source that clears its selection or leaves clears
   it, a member that joins late receives it. Receivers write feature state `muted` on regions
   outside the filter (the same state the legend mutes with, so `mapRegionLayers` needs no change;
   `mutedOpacity` default 0.15, ApexMaps 0.25 is one option away) and `data-ok-muted` on their
   listbox options, which CSS dims. Ids match by value: linked maps must share region ids.

## Consequences
- Additive (minor): four options, one part (`data-ok-map-selection-box`), a listbox state
  (`aria-multiselectable`, `data-ok-muted` options), one event field.
- Maps with `boxSelect` lose MapLibre's Shift + drag zoom; keyboard and wheel zoom stay.
- Label anchors come from rendered tiles: a region whose features are not in any loaded tile (off
  screen) is not in the box anyway; anchors of regions cut by tile edges use the largest piece.
- Not built: lasso selection, a modifier other than Shift, a filter by value ranges, a Clear
  control drawn by the map (apps add a button that calls the HTML instance's `clearSelection()` or
  reset React state), and announcements of a received filter.
