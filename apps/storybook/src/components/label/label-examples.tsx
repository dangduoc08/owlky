import type { ChipColor, LabelVariant } from "@owlky/core";
import { Label } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import { MailIcon } from "../avatar/display-icons.js";
import type { GroupFiles } from "../shared/snippets.js";

const COLORS: ChipColor[] = [
  "default",
  "primary",
  "secondary",
  "info",
  "success",
  "warning",
  "error",
  "black",
  "white",
];
const capitalize = (value: string) => value[0]?.toUpperCase() + value.slice(1);

/** The same markup, in the same order, as `packages/html/src/components/label/examples/<story>-group.html`. */
export const variantGroups = (variant: LabelVariant, title: string): ReactGroup[] => [
  {
    title,
    content: COLORS.map((color) => (
      <Label key={color} variant={variant} color={color}>
        {capitalize(color)}
      </Label>
    )),
  },
];

export const iconGroups: ReactGroup[] = [
  {
    title: "With icon",
    content: [
      <Label key="1" variant="filled" color="primary" startIcon={<MailIcon />}>
        Start icon
      </Label>,
      <Label key="2" variant="outlined" color="primary" startIcon={<MailIcon />}>
        Start icon
      </Label>,
      <Label key="3" variant="soft" color="secondary" endIcon={<MailIcon />}>
        End icon
      </Label>,
      <Label key="4" variant="inverted" color="secondary" endIcon={<MailIcon />}>
        End icon
      </Label>,
    ],
  },
];

/** One group per story: `<story>-group.html`. */
export const files = (title: string): GroupFiles => [[title, "group"]];
