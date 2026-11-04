# @owlky/react

Accessible React components for [Owlky](../../README.md). React 18.3+ / 19.

```sh
pnpm add @owlky/react @owlky/styles
```

```tsx
import "@owlky/styles/owlky.css";
import { Button, ButtonGroup, Fab, IconButton, ToggleButton, ToggleButtonGroup } from "@owlky/react";

<Button variant="contained" color="primary">Save</Button>
<Button variant="outlined" startIcon={<MailIcon />}>Send</Button>
<Button variant="soft" loading loadingPosition="start" startIcon={<MailIcon />}>Saving</Button>
<Button href="/docs">Documentation</Button>
<IconButton color="primary" aria-label="Mail"><MailIcon /></IconButton>
<Fab color="primary" extended><MailIcon />Navigate</Fab>
<ButtonGroup variant="outlined" aria-label="Pages"><Button>One</Button><Button>Two</Button></ButtonGroup>
<ToggleButtonGroup exclusive defaultValue="left" aria-label="Alignment">
  <ToggleButton value="left" aria-label="Left"><AlignLeftIcon /></ToggleButton>
  <ToggleButton value="right" aria-label="Right"><AlignRightIcon /></ToggleButton>
</ToggleButtonGroup>
```

| Component | Props |
|---|---|
| `Button` | `variant` (`contained` · `outlined` · `text` · `soft`), `color` (`inherit` · palette · `black` · `white`), `size` (`sm` · `md` · `lg` · `xl`), `fullWidth`, `startIcon`, `endIcon`, `loading`, `loadingPosition`, `loadingIndicator`, `href` (renders `<a>`), plus native button / anchor props |
| `IconButton` | `color` (`default` · `inherit` · palette · `black` · `white`), `size` (`sm` · `md` · `lg`), `animate`; needs `aria-label` |
| `Fab` | `variant` (`contained` · `outlined` · `soft`), `color` (as IconButton), `size` (`sm` · `md` · `lg`), `extended`, `animate` |
| `ButtonGroup` | `orientation` (`horizontal` · `vertical`); `variant`, `color`, `size`, `disabled` are copied to direct child Buttons (a child prop wins) |
| `ToggleButton` | `value`, `color` (`inherit` · palette), `size`, standalone `selected` / `defaultSelected` / `onChange(selected)` |
| `Drawer` / `DrawerTrigger` / `DrawerContent` / `DrawerClose` | `Drawer`: `open` / `defaultOpen` / `onOpenChange`; `Drawer`: also `variant` (`temporary` · `persistent` · `permanent`), `onOpenChange(open, reason)`; `DrawerContent`: `anchor` (`left` · `right` · `top` · `bottom`), `hideBackdrop`, `disableEscapeKeyDown`, needs `aria-label` / `aria-labelledby`; trigger and close are Buttons |
| `Sortable` | `items`, `getKey`, `renderItem`, `onReorder(items)` (controlled), `onRemove(item, index)` (renders remove buttons), `getItemLabel`, `layout` (`grid` · `vertical` · `horizontal`), `messages`; helper `arrayMove` |
| `ToggleButtonGroup` | `exclusive`, `value` / `defaultValue` / `onChange(value)` (`string \| null` when exclusive, else `string[]`), `orientation`, `color`, `size`, `disabled` |

Same markup and CSS as `@owlky/html` (specs: `specs/components/`).
