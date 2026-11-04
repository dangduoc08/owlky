# @minimal-tailwind/react

Accessible React components for [Minimal Tailwind](../../README.md). React 18.3+ / 19.

```sh
pnpm add @minimal-tailwind/react @minimal-tailwind/styles
```

```tsx
import "@minimal-tailwind/styles/minimal-tailwind.css";
import { Button } from "@minimal-tailwind/react";

<Button variant="contained" color="primary">Save</Button>
<Button variant="outlined" startIcon={<MailIcon />}>Send</Button>
<Button variant="soft" loading loadingPosition="start" startIcon={<MailIcon />}>Saving</Button>
<Button href="/docs">Documentation</Button>
```

| Component | Props |
|---|---|
| `Button` | `variant` (`contained` · `outlined` · `text` · `soft`), `color` (`inherit` · palette · `black` · `white`), `size` (`sm` · `md` · `lg` · `xl`), `fullWidth`, `startIcon`, `endIcon`, `loading`, `loadingPosition`, `loadingIndicator`, `href` (renders `<a>`), plus native button / anchor props |

Same markup and CSS as `@minimal-tailwind/html` (spec: `specs/components/button.md`).
