---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
"@owlky/styles": minor
---

Editor: keep text transforms (`span` with `text-transform: uppercase | lowercase | capitalize`, or
`data-ok-text-transform` in markup) and set them with the `textTransform` action; fullscreen now dims
the page with a composed Backdrop, locks page scrolling and keeps Tab inside the editor
(`holdEditorFullscreen`); heading menu items show each level in its own type; the code block's
language menu has a rule after "auto". React no longer reloads a controlled value at mount when
Tiptap writes it differently.
