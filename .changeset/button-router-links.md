---
"@owlky/styles": minor
"@owlky/react": minor
---

Button, Icon button and Fab: polymorphic `component` and `LinkComponent` (MUI ButtonBase), for router links. `component` renders that element or component with the button's attributes, its `ref` and its own props (such as `to`); `LinkComponent` replaces the `<a>` whenever `href` is set. A disabled router link keeps its `href`, gets `aria-disabled` and `tabindex="-1"`, and receives no pointer events. Icon button takes `href` and renders an icon link (`<a data-ok-icon-button>`, styled like the button, disabled links included). Button group takes `component` for its root (it keeps `role="group"`).
