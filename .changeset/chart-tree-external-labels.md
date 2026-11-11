---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
---

Chart: tree label placement, after ApexTree's `externalLabel`. `externalLabel` (`align` `left` · `center` · `right`, `verticalAlign` `top` · `middle` · `bottom`, `offsetX`, `offsetY`, `rotation`) places every node's label beside its node; `externalLabelLevels` sets it per level (0: the roots) and a hierarchy node's own `externalLabel` wins over both. Options left out keep the default side; radial leaves stay on their ray (`offsetX` moves them outward, `rotation` adds to their angle). The margins make room for the placed labels, and labels are still cut or left out when the estimated text doesn't fit. HTML: `data-ok-external-label` (`"align=right rotation=-20"`) on the chart or on a node's row header, and `data-ok-external-label-levels` (`"0: verticalAlign=top; 2: rotation=-20"`). Trees without these options draw exactly as before.
