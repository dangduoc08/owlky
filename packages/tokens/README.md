# @minimal-tailwind/tokens

Design tokens for [Minimal Tailwind](../../README.md) as typed TypeScript, CSS variables
(`tokens.css`) and JSON.

```ts
import { createTheme, themeToCss } from "@minimal-tailwind/tokens";

const css = themeToCss(
  createTheme({
    palette: { primary: { main: "#2065D1", dark: "#103996", contrastText: "#FFFFFF" } },
  }),
);
```

Default colors are verified for WCAG 2.2 AA contrast in light and dark mode.
