---
"@owlky/core": patch
"@owlky/react": patch
"@owlky/html": patch
---

Fix the Carousel `loop`: a looping carousel keeps its current slide when its viewport resizes (a window resize, or the browser re-snapping before the size change is reported), a resize during an animated move retargets it, and loops that are barely long enough reach every slide (the rotation centers the selected slide in the scroll range, not by count).
