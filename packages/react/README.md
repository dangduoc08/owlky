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
| `Avatar` / `AvatarGroup` | `src` / `alt` (fallback: children → alt letter → icon), `variant` (`circular` · `rounded` · `square`), `color` (`default` · palette), `size` (px or length); group: `max`, `total`, `renderSurplus`, `spacing` (`medium` · `small`), `variant` |
| `Badge` | `badgeContent`, `variant` (`standard` · `dot` · `online` · `always` · `busy` · `offline` · `invisible`), `color`, `overlap` (`rectangular` · `circular`), `anchorOrigin`, `max` (99), `showZero`, `invisible` |
| `Button` | `variant` (`contained` · `outlined` · `text` · `soft`), `color` (`inherit` · palette · `black` · `white`), `size` (`sm` · `md` · `lg` · `xl`), `fullWidth`, `startIcon`, `endIcon`, `loading`, `loadingPosition`, `loadingIndicator`, `href` (renders `<a>`), plus native button / anchor props |
| `IconButton` | `color` (`default` · `inherit` · palette · `black` · `white`), `size` (`sm` · `md` · `lg`), `animate`; needs `aria-label` |
| `Fab` | `variant` (`contained` · `outlined` · `soft`), `color` (as IconButton), `size` (`sm` · `md` · `lg`), `extended`, `animate` |
| `ButtonGroup` | `orientation` (`horizontal` · `vertical`); `variant`, `color`, `size`, `disabled` are copied to direct child Buttons (a child prop wins) |
| `TextField` / `InputAdornment` | `variant` (`outlined` · `filled` · `standard`), `size` (`medium` · `small`), `color` (`default` · palette: focus color), `label`, `helperText`, `error`, `required`, `fullWidth`, `margin` (`none` · `dense` · `normal`), `shrink`, `startAdornment` / `endAdornment` (`InputAdornment position`), `select` (native, `<option>` children), `multiline` + `rows` / `minRows` / `maxRows`, `value` / `defaultValue` / `onChange(value)`; `ref` and native props go to the input |
| `ToggleButton` | `value`, `color` (`inherit` · palette), `size`, standalone `selected` / `defaultSelected` / `onChange(selected)` |
| `Checkbox` | `color` (`default` · palette, default `primary`), `size` (`medium` · `small`), `indeterminate`, `icon` / `checkedIcon` / `indeterminateIcon`, `checked` / `defaultChecked` / `onChange(checked)`; `ref` and native props go to the `<input>`. Name it with `FormControlLabel` or `aria-label` |
| `Chip` | `label`, `variant` (`filled` · `outlined` · `soft`), `color` (`default` · palette · `black` · `white`), `size` (`medium` · `small`), `avatar`, `icon`, `onClick` / `clickable`, `onDelete`, `deleteIcon`, `deleteLabel`, `disabled` |
| `CircularProgress` | `variant` (`indeterminate` · `determinate`), `color` (`inherit` · palette, default `primary`), `value` / `min` / `max`, `size` (px number or `px` · `rem` · `em` length, default 40), `thickness` (default 3.6), `disableShrink`, `enableTrackSlot`; a `progressbar`: needs `aria-label` / `aria-labelledby`. CSS only. Default loader of `Button` / `IconButton` |
| `Label` | `variant` (`soft` · `filled` · `outlined` · `inverted`), `color` (`default` · palette · `black` · `white`), `startIcon`, `endIcon` |
| `LinearProgress` | `variant` (`indeterminate` · `determinate` · `buffer` · `query`), `color` (`inherit` · palette), `value` / `min` / `max`, `valueBuffer`; fills its container; needs a name. CSS only |
| `FormControlLabel` | `control` (a `Checkbox` or `Switch`), `label`, `labelPlacement` (`end` · `start` · `top` · `bottom`), `required` (asterisk); `disabled`, `checked`, `onChange`, `value` are passed to the control |
| `List`, `ListItem`, `ListItemButton`, `ListItemIcon`, `ListItemAvatar`, `ListItemText`, `ListSubheader`, `ListItemExpandIcon` | List `dense`, `disablePadding`, `subheader`; ListItem `alignItems`, `dense`, `disableGutters`, `disablePadding`, `divider`, `secondaryAction`; ListItemButton the same plus `selected`, `disabled`, `href`; ListItemText `primary`, `secondary`, `inset`, `disableTypography`; ListSubheader `color`, `disableGutters`, `disableSticky`, `inset`. Nested lists from app state (`aria-expanded`, `hidden`) |
| `Popover` | `open`, `anchorEl`, `onOpenChange(open, reason)`, `placement` (12 values), `arrow`, `disableEscapeKeyDown`, `disableAutoFocus`, `disableRestoreFocus`, `initialFocus` |
| `Menu`, `MenuItem` | Menu `open`, `anchorEl`, `onOpenChange(open, reason)`, `placement`, `dense`, `paperProps`; MenuItem `selected`, `disabled`, `dense`, `divider`, `disableGutters`, `onClick` |
| `Tooltip` | `title`, `placement`, `arrow`, `transition` (`grow` · `fade` · `zoom`), `enterDelay`, `leaveDelay`, `enterTouchDelay`, `leaveTouchDelay`, `open` / `onOpenChange`, `describeChild`, `disable*Listener` |
| `Dialog`, `DialogTitle`, `DialogContent`, `DialogContentText`, `DialogActions` | Dialog `open`, `onOpenChange(open, reason)`, `maxWidth` (`xs`–`xl`, `none`), `fullWidth`, `fullScreen`, `scroll` (`paper` · `body`), `hideBackdrop`, `disableEscapeKeyDown`, `paperProps`; DialogContent `dividers`; DialogActions `disableSpacing` |
| `Toaster`, `toast` | Toaster `position`, `duration`, `visibleToasts`, `closeButton`; `toast()`, `toast.success` / `info` / `warning` / `error` / `loading` / `promise` / `custom` / `dismiss` |
| `Divider` | `variant` (`fullWidth` · `inset` · `middle`), `orientation` (`horizontal` · `vertical`), `flexItem`, `textAlign` (`center` · `left` · `right`, with children), `absolute`, `children` (text on the line). CSS only |
| `Drawer` / `DrawerTrigger` / `DrawerContent` / `DrawerClose` | `Drawer`: `open` / `defaultOpen` / `onOpenChange`; `Drawer`: also `variant` (`temporary` · `persistent` · `permanent`), `onOpenChange(open, reason)`; `DrawerContent`: `anchor` (`left` · `right` · `top` · `bottom`), `hideBackdrop`, `disableEscapeKeyDown`, needs `aria-label` / `aria-labelledby`; trigger and close are Buttons |
| `Pagination` / `PaginationItem` | `count`, `page` / `defaultPage` / `onChange(page)` (1-based), `variant` (`text` · `outlined` · `soft`), `color` (`standard` · palette), `shape` (`circular` · `rounded`), `size` (`sm` · `md` · `lg`), `disabled`, `siblingCount`, `boundaryCount`, `showFirstButton`, `showLastButton`, `hidePrevButton`, `hideNextButton`, `getItemAriaLabel`, `renderItem` (`PaginationItem`, `href` for links), `icons` |
| `Radio` / `RadioGroup` | `Radio`: `value`, `color` (`default` · palette), `size` (`medium` · `small`), `icon` / `checkedIcon`; `RadioGroup`: `name`, `value` / `defaultValue` / `onChange(value)`, `row`, needs `aria-label` / `aria-labelledby`. Native radios, CSS only |
| `Scrollbar` | `autoHide` (default `true`: thumb on hover / focus), `aria-label` (default `"scrollable content"`), `tabIndex` (default `0`); a `<section>` that scrolls itself (`ref`). Wrap `Table` (inside `TableContainer`), drawer content or a `Sortable` in it. CSS only |
| `Sortable` | `items`, `getKey`, `renderItem`, `onReorder(items)` (controlled), `onRemove(item, index)` (renders remove buttons), `getItemLabel`, `layout` (`grid` · `vertical` · `horizontal`), `messages`; helper `arrayMove` |
| `Switch` | `color` (`default` · palette), `size` (`medium` · `small`), `edge` (`start` · `end`), `checked` / `defaultChecked` / `onChange(checked)`; a native checkbox with `role="switch"`, `ref` to the input. CSS only |
| `Table` / `TableContainer` / `TableHead` / `TableBody` / `TableFooter` / `TableRow` / `TableCell` | `Table`: `size` (`medium` · `small`), `padding` (`normal` · `checkbox` · `none`), `stickyHeader`; `TableContainer`: needs `aria-label` (focusable scroll region); `TableRow`: `hover`, `selected`; `TableCell`: `align`, `padding`, `size`, `sortDirection` (→ `aria-sort`), `scope="row"` renders `<th>` |
| `TableSortLabel` / `TablePagination` / `TableExpandButton` / `TableDetailRow` | `TableSortLabel`: `active`, `direction`, `hideSortIcon`, `icon`; `TablePagination`: `count`, `page`, `rowsPerPage`, `onPageChange(page)`, `onRowsPerPageChange(rows)`, `rowsPerPageOptions`, `labelRowsPerPage`, `labelDisplayedRows`, `getItemAriaLabel`, `showFirstButton`, `showLastButton`, `disabled`; `TableExpandButton`: `expanded`, `controls`, `aria-label`; `TableDetailRow`: `id`, `open`, `colSpan`. Data helpers in `@owlky/core` |
| `Tabs` / `Tab` / `TabPanel` | Tabs `value` / `defaultValue` / `onChange(value)`, `variant` (`standard` · `scrollable` · `fullWidth`), `orientation`, `textColor` / `indicatorColor` (`inherit` · `primary` · `secondary`), `centered`, `scrollButtons` (`"auto"` · `true` · `false`), `allowScrollButtonsMobile`, `visibleScrollbar`, `segmented`, `selectionFollowsFocus`, `aria-label`; Tab `value`, `label`, `icon`, `iconPosition` (`top` · `bottom` · `start` · `end`), `wrapped`, `disabled`; TabPanel: `role="tabpanel"` (set `hidden`, `id`, `aria-labelledby`) |
| `Breadcrumbs` / `BreadcrumbsDot` | `separator` (default `"/"`), `maxItems` (8), `itemsBeforeCollapse` / `itemsAfterCollapse` (1), `expandText`, `aria-label` (default `"breadcrumb"`); children are the items (`a`, `span[aria-current="page"]`) |
| `Stepper`, `Step`, `StepLabel`, `StepConnector`, `StepContent` | Stepper `activeStep`, `orientation`, `alternativeLabel`, `variant` (`standard` · `dot` · `circle`), `connector`; Step `active` / `completed` / `disabled` overrides; StepLabel `error`, `optional`, `icon` |
| `MobileStepper` | `steps`, `activeStep`, `variant` (`dots` · `text` · `progress`), `position` (`bottom` · `top` · `static`), `backButton`, `nextButton`, `getStepLabel` |
| `Timeline`, `TimelineItem`, `TimelineSeparator`, `TimelineDot`, `TimelineConnector`, `TimelineContent`, `TimelineOppositeContent` | Timeline / TimelineItem `position` (`right` · `left` · `alternate` · `alternate-reverse`); TimelineDot `variant` (`filled` · `outlined`), `color` (`grey` · `inherit` · palette) |
| `Rating` | `value` / `defaultValue` / `onChange(value)` (`number \| null`), `onChangeActive`, `max`, `precision`, `size` (`xxSmall` · `xSmall` · `small` · `medium` · `large`), `color`, `highlightSelectedOnly`, `readOnly`, `disabled`, `icon`, `emptyIcon`, `getLabelText`, `emptyLabelText`, `name` |
| `Slider` | `value` / `defaultValue` / `onChange(value, activeThumb)` (a number, or `[start, end]` for a range), `onChangeCommitted`, `min`, `max`, `step` (`null`: marks only), `marks`, `track` (`normal` · `inverted` · `false`), `orientation`, `size`, `color`, `valueLabelDisplay` (`off` · `auto` · `on`), `valueLabelFormat`, `disableSwap`, `disabled`, `getAriaLabel`, `getAriaValueText`, `name` |
| `TransferList` | `items`, `left` / `right` / `defaultLeft` / `onChange(left, right)`, `variant` (`simple` · `enhanced`), `titles`, `buttonLabels`, `getCountLabel`, `disabled` |
| `SimpleTreeView` / `TreeItem` / `RichTreeView` | `expandedItems` / `defaultExpandedItems` / `onExpandedItemsChange`, `selectedItems` / `defaultSelectedItems` / `onSelectedItemsChange`, `onItemExpansionToggle`, `multiSelect`, `checkboxSelection`, `disableSelection`, `expansionTrigger` (`content` · `iconContainer`), `variant` (`standard` · `lines`), `expandIcon` / `collapseIcon` / `endIcon`; TreeItem `itemId`, `label`, `disabled`; RichTreeView `items` |
| `Autocomplete` | `options` (strings or `{ value, label, disabled }`), `value` / `defaultValue` / `onChange(value)`, `inputValue` / `onInputChange`, `open` / `onOpenChange(open, reason)`, `multiple`, `freeSolo`, `disableCloseOnSelect`, `disableClearable`, `openOnFocus`, `autoHighlight`, `limitTags`, `getLimitTagsText`, `filterOptions`, `renderOption`, `noOptionsText`, and the TextField props `label`, `placeholder`, `helperText`, `error`, `variant`, `size`, `disabled` |
| `Motion` | `variant` (48 entrances and exits such as `fadeInUp`, loops `kenburns*` · `pan*` · `color2x`–`color5x`, `draw`, `interactive`), `trigger` (`inView` · `mount` · `manual`), `in`, `once`, `amount`, `duration`, `delay`, `distance`, `paused` |
| `MotionGroup` / `MotionText` | Group: trigger props and `stagger` (direct child Motions in order); Text: a string `children` animated letter by letter, `variant`, trigger props, `stagger` |
| `CountUp` | `end`, `start`, `decimals`, `duration`, `prefix`, `suffix`, trigger props |
| `MotionBorder` | `shape` (`rounded` · `circle`), `color` (`multi` · palette), `width`, `duration`, `paused` |
| `Dialog` `transition` | A Motion entrance for the paper (`slideInUp`, `zoomIn`…) |
| `DataGrid` | `rows`, `columns` (`GridColDef`: `field`, `headerName`, `type`, `width` / `flex` / `minWidth`, `align`, `valueGetter`, `valueFormatter`, `renderCell`, `sortable` / `filterable` / `hideable`), `getRowId`, `checkboxSelection`, `rowSelectionModel`, `sortModel`, `filterModel`, `paginationModel` / `pageSizeOptions`, `columnVisibilityModel`, `density` (each with `on…Change`), `initialState`, `showToolbar`, `disable…` flags, `localeText`, `exportFileName`; `filterModel.logicOperator`, `columnOrder`, `pinnedColumns`, `onColumnWidthChange`, `editable` columns with `editMode` and `processRowUpdate`; `disableVirtualization`, `sortingMode` / `filterMode` / `paginationMode` with `rowCount`, `loading` / `loadingVariant`, `onRowsScrollEnd`, `dataSource` / `dataSourceCache` / `onDataSourceError`; `apiRef` (`useGridApiRef`), `disableMultipleRowSelection`, `isRowSelectable`, `colSpan`, `rowSpanning`, `getRowHeight`, `getRowSpacing`, `autosizeOnMount`, click events, `preProcessEditCellProps`, `isCellEditable`, `filterOperators`, `ignoreDiacritics`, `csvOptions`, `printOptions`, `toolbarVariant`, `localeText` with the core locale packs |
| `DatePicker`, `DesktopDatePicker`, `MobileDatePicker`, `StaticDatePicker` | `value` / `defaultValue` / `onChange(value, { validationError })`, `onAccept`, `onError`, `open` / `onOpenChange(open, reason)`, `views`, `openTo`, `view` / `onViewChange`, `format`, `formatDensity`, `minDate` / `maxDate`, `disablePast` / `disableFuture`, `shouldDisableDate` / `Month` / `Year`, `closeOnSelect`, `actions`, `shortcuts`, `orientation`, `desktopModeMediaQuery`, `keepOpenDuringFieldFocus`, the calendar and field props below, `localeText` |
| `DateField` · `DateCalendar` · `MonthCalendar` · `YearCalendar` | Field: `format`, `clearable` / `onClear`, `readOnly`, `selectedSections`, the TextField props, `name` (a hidden ISO input). Calendar: `views`, `displayWeekNumber`, `fixedWeekNumber`, `showDaysOutsideCurrentMonth`, `disableHighlightToday`, `dayOfWeekFormatter`, `monthsPerRow` / `yearsPerRow` / `yearsOrder`, `loading` / `renderLoading`, `onMonthChange` / `onYearChange` |
| `LocalizationProvider` | `adapterLocale` (such as `"vi-VN"`), `localeText` (English and Vietnamese built in) |
| `ToggleButtonGroup` | `exclusive`, `value` / `defaultValue` / `onChange(value)` (`string \| null` when exclusive, else `string[]`), `orientation`, `color`, `size`, `disabled` |

Same markup and CSS as `@owlky/html` (specs: `specs/components/`).
