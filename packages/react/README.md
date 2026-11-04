# @minimal-tailwind/react

Accessible React components for [Minimal Tailwind](../../README.md). React 18.3+ / 19.

```sh
pnpm add @minimal-tailwind/react @minimal-tailwind/styles
```

```tsx
import "@minimal-tailwind/styles/minimal-tailwind.css";
import {
  Button, Switch,
  Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogBody, DialogActions, DialogClose,
} from "@minimal-tailwind/react";

<Button variant="contained" color="primary">Save</Button>
<Switch label="Notifications" defaultChecked onCheckedChange={console.log} />

<Dialog>
  <DialogTrigger variant="contained">Delete</DialogTrigger>
  <DialogContent size="xs">
    <DialogTitle>Delete project?</DialogTitle>
    <DialogBody><DialogDescription>This can't be undone.</DialogDescription></DialogBody>
    <DialogActions>
      <DialogClose variant="outlined">Cancel</DialogClose>
      <DialogClose variant="contained" color="error">Delete</DialogClose>
    </DialogActions>
  </DialogContent>
</Dialog>
```

Controlled or uncontrolled (`open`/`defaultOpen`/`onOpenChange`, `checked`/`defaultChecked`).
Docs and live examples: Storybook (React/*). Same markup and CSS as `@minimal-tailwind/html`.
