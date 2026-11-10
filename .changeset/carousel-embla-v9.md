---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
---

Carousel: Embla Carousel v9 names and events. The API (React `apiRef`, HTML instance) adds `goToNext()`, `goToPrev()`, `goTo(index, jump, direction)` (`"forward"` or `"backward"` round a loop), `canGoToNext()`, `canGoToPrev()`, `selectedSnap()`, `previousSnap()`, `snapList()` and `snapIndex(offset)` next to the v8 names. New events: `ok:carousel:resize` (`{ entries }`, the viewport or a slide changed size) and `ok:carousel:slideschanged` (`{ records }`), both cancelable to skip the re-measure, and `ok:carousel:pointermove` (cancelable, skips the drag step); React `onResize(entries)` and `onSlidesChanged(records)` (return `false` to cancel; `onResize` replaces React's media event prop on the root). Core: controller options `onResize`, `onSlidesChanged`, `onPointerMove`; type `CarouselDirection`.
