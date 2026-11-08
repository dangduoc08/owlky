import {
  Avatar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  type DialogMaxWidth,
  type DialogScroll,
  DialogTitle,
  type DialogTransition,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  TextField,
} from "@owlky/react";
import { type ReactNode, useState } from "react";
import { DemoIcon } from "../shared/demo-icon.js";

/** Open state shared by the demos: a trigger button and its dialog. */
function useDialog() {
  const [open, setOpen] = useState(false);
  return { open, show: () => setOpen(true), onOpenChange: (next: boolean) => setOpen(next) };
}

function Trigger({
  id,
  open,
  show,
  color,
  children,
}: {
  id: string;
  open: boolean;
  show: () => void;
  color?: "info" | "success" | "warning" | "error";
  children: ReactNode;
}) {
  return (
    <Button
      variant="outlined"
      color={color}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={id}
      onClick={show}
    >
      {children}
    </Button>
  );
}

const EMAILS = ["username@gmail.com", "user02@gmail.com"];

/** Simple: pick an account from a list; the choice closes the dialog. */
export function SimpleDialogDemo() {
  const dialog = useDialog();
  const [selected, setSelected] = useState(EMAILS[1] as string);
  const choose = (value: string) => {
    setSelected(value);
    dialog.onOpenChange(false);
  };
  return (
    <div>
      <Trigger id="dialog-simple" {...dialog}>
        Open simple dialog
      </Trigger>
      <p>Selected: {selected}</p>
      <Dialog id="dialog-simple" open={dialog.open} onOpenChange={dialog.onOpenChange}>
        <DialogTitle>Set backup account</DialogTitle>
        <List aria-label="Accounts">
          {EMAILS.map((email) => (
            <ListItem key={email} disablePadding>
              <ListItemButton onClick={() => choose(email)}>
                <ListItemAvatar>
                  <Avatar color="primary">
                    <DemoIcon name="person" />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={email} />
              </ListItemButton>
            </ListItem>
          ))}
          <ListItem disablePadding>
            <ListItemButton onClick={() => choose("A new account")}>
              <ListItemAvatar>
                <Avatar>
                  <DemoIcon name="plus" />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary="Add account" />
            </ListItemButton>
          </ListItem>
        </List>
      </Dialog>
    </div>
  );
}

/** Alerts: a short question with two answers. */
export function AlertDialogDemo({
  id = "dialog-alert",
  label = "Open alert dialog",
  color = "info",
  transition,
}: {
  id?: string;
  label?: string;
  color?: "info" | "success" | "warning" | "error";
  transition?: DialogTransition;
}) {
  const dialog = useDialog();
  const close = () => dialog.onOpenChange(false);
  return (
    <>
      <Trigger id={id} color={color} {...dialog}>
        {label}
      </Trigger>
      <Dialog id={id} open={dialog.open} onOpenChange={dialog.onOpenChange} transition={transition}>
        <DialogTitle>Share your location?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Apps can use your location to show results near you. You can change this later in
            Settings.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={close}>
            Not now
          </Button>
          <Button variant="contained" onClick={close}>
            Allow
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/** Transitions: the same dialog; the paper slides in from below (reduced motion: no animation). */
export function TransitionsDialogDemo() {
  return (
    <AlertDialogDemo
      id="dialog-transitions"
      label="Transitions dialog"
      color="success"
      transition="slideInUp"
    />
  );
}

/** Form: a field and the actions that submit or cancel it. */
export function FormDialogDemo() {
  const dialog = useDialog();
  const close = () => dialog.onOpenChange(false);
  return (
    <>
      <Trigger id="dialog-form" color="warning" {...dialog}>
        Form dialog
      </Trigger>
      <Dialog id="dialog-form" open={dialog.open} onOpenChange={dialog.onOpenChange}>
        <DialogTitle>Subscribe</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter your email address to get our newsletter once a month.
          </DialogContentText>
          <TextField id="dialog-form-email" type="email" label="Email address" fullWidth />
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={close}>
            Cancel
          </Button>
          <Button variant="contained" onClick={close}>
            Subscribe
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const SOUNDS: [string, string][] = [
  ["Phone ringtone", "Aurora"],
  ["Default notification ringtone", "Chime"],
];

/** Full-screen: a toolbar with close and save, then settings. */
export function FullScreenDialogDemo() {
  const dialog = useDialog();
  const close = () => dialog.onOpenChange(false);
  return (
    <>
      <Trigger id="dialog-full-screen" color="error" {...dialog}>
        Open full-screen dialog
      </Trigger>
      <Dialog
        id="dialog-full-screen"
        fullScreen
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
      >
        <header>
          <IconButton aria-label="Close" onClick={close}>
            <DemoIcon name="close" />
          </IconButton>
          <DialogTitle>Sound</DialogTitle>
          <Button variant="contained" onClick={close}>
            Save
          </Button>
        </header>
        <List aria-label="Sound settings">
          {SOUNDS.map(([primary, secondary], index) => (
            <ListItem key={primary} disablePadding divider={index === 0}>
              <ListItemButton>
                <ListItemText primary={primary} secondary={secondary} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Dialog>
    </>
  );
}

const WIDTHS: DialogMaxWidth[] = ["xs", "sm", "md", "lg", "xl"];

/** Max width: the same dialog at each `maxWidth`, full width. */
export function MaxWidthDialogDemo() {
  const [open, setOpen] = useState<DialogMaxWidth | null>(null);
  return (
    <>
      {WIDTHS.map((width) => (
        <Button
          key={width}
          variant="outlined"
          aria-haspopup="dialog"
          aria-expanded={open === width}
          aria-controls={`dialog-width-${width}`}
          onClick={() => setOpen(width)}
        >
          {width}
        </Button>
      ))}
      {WIDTHS.map((width) => (
        <Dialog
          key={width}
          id={`dialog-width-${width}`}
          maxWidth={width}
          fullWidth
          open={open === width}
          onOpenChange={() => setOpen(null)}
        >
          <DialogTitle>Max width {width}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This dialog takes the full width allowed by maxWidth {width}, and less on small
              screens.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button variant="outlined" onClick={() => setOpen(null)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      ))}
    </>
  );
}

const PARAGRAPH =
  "Owlky dialogs keep the title and the actions in view while long content scrolls. With scroll set to body, the whole dialog scrolls with the page instead.";

/** Scrolling content: the paper scrolls, or the whole dialog does. */
export function ScrollDialogDemo() {
  const [open, setOpen] = useState<DialogScroll | null>(null);
  const scrolls: DialogScroll[] = ["paper", "body"];
  return (
    <>
      {scrolls.map((scroll) => (
        <Button
          key={scroll}
          variant="outlined"
          aria-haspopup="dialog"
          aria-expanded={open === scroll}
          aria-controls={`dialog-scroll-${scroll}`}
          onClick={() => setOpen(scroll)}
        >
          Scroll={scroll}
        </Button>
      ))}
      {scrolls.map((scroll) => (
        <Dialog
          key={scroll}
          id={`dialog-scroll-${scroll}`}
          scroll={scroll}
          open={open === scroll}
          onOpenChange={() => setOpen(null)}
        >
          <DialogTitle>Terms of use</DialogTitle>
          <DialogContent
            dividers={scroll === "paper"}
            tabIndex={0}
            role="region"
            aria-label="Terms"
          >
            {Array.from({ length: 12 }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: a fixed list of paragraphs.
              <DialogContentText key={i}>{PARAGRAPH}</DialogContentText>
            ))}
          </DialogContent>
          <DialogActions>
            <Button variant="outlined" onClick={() => setOpen(null)}>
              Cancel
            </Button>
            <Button variant="contained" onClick={() => setOpen(null)}>
              Accept
            </Button>
          </DialogActions>
        </Dialog>
      ))}
    </>
  );
}
