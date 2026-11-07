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

Theme settings (ADR-0017): `applyThemeSettings`, `readThemeSettings`, `resetThemeSettings` are
re-exported from `@owlky/core` (call them from an effect or an event handler).

| Component | Props |
|---|---|
| `Accordion` / `AccordionSummary` / `AccordionDetails` / `AccordionActions` | `Accordion` (a `<details>`): `expanded` / `defaultExpanded` / `onChange(expanded)`, `variant` (`default` · `outlined` · `soft`), `disableGutters`, `disabled`, `name` (one open at a time); `AccordionSummary`: `expandIcon` (`null` hides it) |
| `Alert` / `AlertTitle` | `severity` (`success` · `info` · `warning` · `error`), `variant` (`standard` · `filled` · `outlined`), `color` (default: the severity's), `icon` (`false` hides it), `iconMapping`, `action`, `onClose` (renders a close button), `closeText`, `role` (default `alert`) |
| `Button` | `variant` (`contained` · `outlined` · `text` · `soft`), `color` (`inherit` · palette · `black` · `white`), `size` (`sm` · `md` · `lg` · `xl`), `fullWidth`, `startIcon`, `endIcon`, `loading`, `loadingPosition`, `loadingIndicator`, `href` (renders `<a>`), plus native button / anchor props |
| `IconButton` | `color` (`default` · `inherit` · palette · `black` · `white`), `size` (`sm` · `md` · `lg`), `animate`; needs `aria-label` |
| `Fab` | `variant` (`contained` · `outlined` · `soft`), `color` (as IconButton), `size` (`sm` · `md` · `lg`), `extended`, `animate` |
| `ButtonGroup` | `orientation` (`horizontal` · `vertical`); `variant`, `color`, `size`, `disabled` are copied to direct child Buttons (a child prop wins) |
| `ToggleButton` | `value`, `color` (`inherit` · palette), `size`, standalone `selected` / `defaultSelected` / `onChange(selected)` |
| `CircularProgress` | `variant` (`indeterminate` · `determinate`), `color` (`inherit` · palette, default `primary`), `value` / `min` / `max`, `size` (px number or `px` · `rem` · `em` length, default 40), `thickness` (default 3.6), `disableShrink`, `enableTrackSlot`; a `progressbar`: needs `aria-label` / `aria-labelledby`. CSS only. Default loader of `Button` / `IconButton` |
| `LinearProgress` | `variant` (`indeterminate` · `determinate` · `buffer` · `query`), `color` (`inherit` · palette), `value` / `min` / `max`, `valueBuffer`; fills its container; needs a name. CSS only |
| `Drawer` / `DrawerTrigger` / `DrawerContent` / `DrawerClose` | `Drawer`: `open` / `defaultOpen` / `onOpenChange`; `Drawer`: also `variant` (`temporary` · `persistent` · `permanent`), `onOpenChange(open, reason)`; `DrawerContent`: `anchor` (`left` · `right` · `top` · `bottom`), `hideBackdrop`, `disableEscapeKeyDown`, needs `aria-label` / `aria-labelledby`; trigger and close are Buttons |
| `Pagination` / `PaginationItem` | `count`, `page` / `defaultPage` / `onChange(page)` (1-based), `variant` (`text` · `outlined` · `soft`), `color` (`standard` · palette), `shape` (`circular` · `rounded`), `size` (`sm` · `md` · `lg`), `disabled`, `siblingCount`, `boundaryCount`, `showFirstButton`, `showLastButton`, `hidePrevButton`, `hideNextButton`, `getItemAriaLabel`, `renderItem` (`PaginationItem`, `href` for links), `icons` |
| `Scrollbar` | `autoHide` (default `true`: thumb on hover / focus), `aria-label` (default `"scrollable content"`), `tabIndex` (default `0`); a `<section>` that scrolls itself (`ref`). Wrap `Table` (inside `TableContainer`), drawer content or a `Sortable` in it. CSS only |
| `Sortable` | `items`, `getKey`, `renderItem`, `onReorder(items)` (controlled), `onRemove(item, index)` (renders remove buttons), `getItemLabel`, `layout` (`grid` · `vertical` · `horizontal`), `messages`; helper `arrayMove` |
| `Table` / `TableContainer` / `TableHead` / `TableBody` / `TableFooter` / `TableRow` / `TableCell` | `Table`: `size` (`medium` · `small`), `padding` (`normal` · `checkbox` · `none`), `stickyHeader`; `TableContainer`: needs `aria-label` (focusable scroll region); `TableRow`: `hover`, `selected`; `TableCell`: `align`, `padding`, `size`, `sortDirection` (→ `aria-sort`), `scope="row"` renders `<th>` |
| `TableSortLabel` / `TablePagination` / `TableExpandButton` / `TableDetailRow` | `TableSortLabel`: `active`, `direction`, `hideSortIcon`, `icon`; `TablePagination`: `count`, `page`, `rowsPerPage`, `onPageChange(page)`, `onRowsPerPageChange(rows)`, `rowsPerPageOptions`, `labelRowsPerPage`, `labelDisplayedRows`, `getItemAriaLabel`, `showFirstButton`, `showLastButton`, `disabled`; `TableExpandButton`: `expanded`, `controls`, `aria-label`; `TableDetailRow`: `id`, `open`, `colSpan`. Data helpers in `@owlky/core` |
| `ToggleButtonGroup` | `exclusive`, `value` / `defaultValue` / `onChange(value)` (`string \| null` when exclusive, else `string[]`), `orientation`, `color`, `size`, `disabled` |

Same markup and CSS as `@owlky/html` (specs: `specs/components/`).
