---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Tabs: link tabs (`Tab href` or `component`, such as a router link; HTML `a[data-ok-tab][href]`) follow the navigation pattern: the root is a named `navigation` landmark, the current link has `aria-current="page"`, links keep the usual Tab order. React adds `TabContext` and `TabPanel value` / `keepMounted` (panels link to their tab and hide themselves). Core adds `isSelectedTab` and `markTab`. New story: Nav tabs.
