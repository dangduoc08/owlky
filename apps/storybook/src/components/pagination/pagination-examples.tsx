import { paginationOptions } from "@owlky/core";
import { Pagination } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import { DemoIcon } from "../shared/demo-icon.js";
import type { GroupFiles } from "../shared/snippets.js";
import { ItemsDemo } from "./items-demo.js";
import { TablePaginationDemo } from "./table-pagination-demo.js";

const VARIANTS = ["text", "outlined", "soft"] as const;
const COLORS = ["standard", "primary", "secondary", "info", "success", "warning", "error"] as const;

/** "Shapes": each variant, enabled and disabled — same markup as `shapes-<shape>.html`. */
export const shapeGroups: ReactGroup[] = (["circular", "rounded"] as const).map((shape) => ({
  title: shape === "circular" ? "Circular" : "Rounded",
  content: VARIANTS.flatMap((variant) => [
    <Pagination key={variant} count={8} variant={variant} shape={shape} />,
    <Pagination key={`${variant}-disabled`} count={8} variant={variant} shape={shape} disabled />,
  ]),
}));
export const SHAPE_FILES: GroupFiles = [
  ["Circular", "circular"],
  ["Rounded", "rounded"],
];

/** "Variants": every color of each variant — `variants-<variant>.html`. */
export const variantGroups: ReactGroup[] = VARIANTS.map((variant) => ({
  title: variant[0]?.toUpperCase() + variant.slice(1),
  content: COLORS.map((color) => (
    <Pagination key={color} count={10} variant={variant} color={color} />
  )),
}));
export const VARIANT_FILES: GroupFiles = VARIANTS.map((variant) => [
  variant[0]?.toUpperCase() + variant.slice(1),
  variant,
]);

export const sizeGroups: ReactGroup[] = [
  {
    title: "Sizes",
    content: (["sm", "md", "lg"] as const).map((size) => (
      <Pagination key={size} count={10} size={size} />
    )),
  },
];

export const buttonGroups: ReactGroup[] = [
  {
    title: "Buttons",
    content: [
      <Pagination key="first-last" count={10} showFirstButton showLastButton />,
      <Pagination key="hidden" count={10} hidePrevButton hideNextButton />,
    ],
  },
];

/** "Ranges": count 11, page 6 — sibling and boundary counts. */
export const rangeGroups: ReactGroup[] = [
  {
    title: "Ranges",
    content: [
      <Pagination key="s0" count={11} defaultPage={6} siblingCount={0} />,
      <Pagination key="default" count={11} defaultPage={6} />,
      <Pagination key="s0b2" count={11} defaultPage={6} siblingCount={0} boundaryCount={2} />,
      <Pagination key="b2" count={11} defaultPage={6} boundaryCount={2} />,
    ],
  },
];

export const iconGroups: ReactGroup[] = [
  {
    title: "Custom icons",
    content: (
      <Pagination
        count={10}
        variant="soft"
        color="info"
        icons={{ previous: <DemoIcon name="arrowLeft" />, next: <DemoIcon name="arrowRight" /> }}
      />
    ),
  },
];

export const tableGroups: ReactGroup[] = [{ title: "Table", content: <TablePaginationDemo /> }];

export const itemsGroups: ReactGroup[] = [{ title: "Items", content: <ItemsDemo /> }];

export const files = (title: string): GroupFiles => [[title, "group"]];

/** Story Controls shared by the React and HTML stories (ADR-0015). */
export const PAGINATION_CONTROLS = {
  schema: paginationOptions,
  keys: ["variant", "color", "shape", "size", "disabled"],
} as const;
