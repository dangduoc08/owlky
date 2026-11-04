# ADR-0010: Testing strategy

**Status:** Accepted

| Layer                  | Tool                                                                             | Runs in                                     | Covers                                                                                                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tokens / styles source | Vitest                                                                           | Node                                        | AA contrast, CSS generation, zero-specificity rule, token references, bundle completeness                                                                                                          |
| core, html, react      | Vitest **browser mode** + Playwright provider, Testing Library (React), axe-core | Real Chromium (CI: + Firefox, WebKit)       | Behavior, focus, keyboard, lifecycle, idempotency, version policy, fallbacks, a11y. jsdom lacks the top layer, `showModal`, Popover and real focus, so it is not used. Tests load the shipped CSS. |
| E2E                    | Playwright against built Storybook + plain-HTML example                          | Chromium, Firefox, WebKit, mobile (Pixel 7) | React ↔ HTML **anatomy and pixel parity**, interactions, themes, responsive, WCAG 2.2 AA (axe), published dist on a framework-free page, double script loading                                     |
| Visual regression      | Playwright `toHaveScreenshot` (`@visual`)                                        | Playwright Docker image only                | Key components, light + dark                                                                                                                                                                       |

Scripts: `pnpm test` · `pnpm test:e2e` · `pnpm test:visual` / `test:visual:update` (Docker) ·
`VITEST_BROWSERS=chromium,firefox,webkit pnpm test`.
