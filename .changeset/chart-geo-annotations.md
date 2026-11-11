---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Chart `type="geo"`: annotations. `point` and `text` annotations sit at a longitude (`x`) and latitude (`y`), or on a region with the new `region` field (HTML `li[data-ok-region]`): at its label anchor, and a point outlines the region (`path[data-ok-chart-annotation-outline]`). Data labels covered by an annotation are dropped; annotations never move. Core exports `chartAnnotationTag()`, the label tag shared with the other charts. A "Geo annotations" story.
