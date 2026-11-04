import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@minimal-tailwind/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Row } from "../../helpers/row.js";

const meta = {
  title: "React/Dialog",
  component: Dialog,
  subcomponents: {
    DialogTrigger,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogBody,
    DialogActions,
    DialogClose,
  },
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Modal dialog on native `<dialog>.showModal()` (top layer, inert page) with focus management, Escape/backdrop dismissal, scroll lock and focus return — shared with the HTML implementation through `@minimal-tailwind/core`. Spec: `specs/components/dialog.md`.",
      },
    },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <Row>
      <Dialog>
        <DialogTrigger variant="contained">Open dialog</DialogTrigger>
        <DialogContent size="xs">
          <DialogTitle>Delete project?</DialogTitle>
          <DialogBody>
            <DialogDescription>
              This permanently deletes the project and its files. You can't undo this.
            </DialogDescription>
          </DialogBody>
          <DialogActions>
            <DialogClose variant="outlined">Cancel</DialogClose>
            <DialogClose variant="contained" color="error">
              Delete
            </DialogClose>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </Row>
  ),
};

export const NotDismissible: Story = {
  render: () => (
    <Row>
      <Dialog>
        <DialogTrigger variant="soft" color="warning">
          Review terms
        </DialogTrigger>
        <DialogContent size="sm" closeOnEscape={false} closeOnBackdropClick={false}>
          <DialogTitle>Accept the new terms</DialogTitle>
          <DialogBody>
            <p>Escape and backdrop clicks are disabled: an explicit choice is required.</p>
          </DialogBody>
          <DialogActions>
            <DialogClose variant="contained" color="primary">
              I accept
            </DialogClose>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </Row>
  ),
};

export const Controlled: Story = {
  render: function Controlled() {
    const [open, setOpen] = useState(false);
    return (
      <Row>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger variant="outlined">Open (controlled)</DialogTrigger>
          <DialogContent>
            <DialogTitle>Controlled dialog</DialogTitle>
            <DialogBody>
              <p>
                State lives in the parent: <code>open={String(open)}</code>.
              </p>
            </DialogBody>
            <DialogActions>
              <DialogClose variant="contained">Done</DialogClose>
            </DialogActions>
          </DialogContent>
        </Dialog>
      </Row>
    );
  },
};

const sections = Array.from(
  { length: 30 },
  (_, i) => `Section ${i + 1}. The body scrolls while the title and actions stay in place.`,
);

export const LongContent: Story = {
  render: () => (
    <Row>
      <Dialog>
        <DialogTrigger variant="outlined">Long content</DialogTrigger>
        <DialogContent size="md">
          <DialogTitle>Terms of service</DialogTitle>
          <DialogBody>
            {sections.map((text) => (
              <p key={text}>{text}</p>
            ))}
          </DialogBody>
          <DialogActions>
            <DialogClose variant="contained">Close</DialogClose>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </Row>
  ),
};
