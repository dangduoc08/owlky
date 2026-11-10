---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Menu: nested menus (React `MenuSubmenu`; HTML `li[data-ok-menu-submenu]` around a trigger item and its popover) with Arrow Right / Enter / Space / a click to open, Arrow Left / Escape to close, mirrored in right-to-left pages, and hover intent. New options `variant` (`selectedMenu` or `menu`), `disableAutoFocusItem`, `disabledItemsFocusable` and `disableListWrap`; Menu passes `anchorReference`, `anchorPosition`, `marginThreshold` and `transitionDuration` to its Popover. React `MenuList` works without a Popover (`autoFocus`, `autoFocusItem`, `variant`; its focus item takes the tab stop). New stories: Nested menu, Menu list.
