---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Lightbox: more render functions. React `render.slideContainer({ slide, index, children })` wraps each slide's content; `render.buttonPrev`, `buttonNext`, `buttonClose`, `buttonZoom` (both zoom buttons), `buttonSlideshow`, `buttonFullscreen`, `buttonDownload`, `buttonShare`, `buttonCaptions` and `buttonThumbnails` replace the built-in buttons and get the attributes that keep their behavior (`LightboxButtonAttributes`; `null` leaves a button out); `render.iconLoading` and `render.iconError` show an icon over an image slide while its picture loads or after it failed. HTML: replacement buttons are your own markup with the same attribute, and `template[data-ok-lightbox-icon="loading|error"]` in the lightbox is copied into every image slide. Core: the controller writes `data-ok-status` (`loading` · `complete` · `error`) on image slides. The pull-to-close style now also reaches a zoom frame inside a wrapper.
