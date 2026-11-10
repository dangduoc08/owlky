"use client";

import { buttonOptions } from "@owlky/core";
import { Button } from "@owlky/react";
import type { ComponentProps, ReactNode } from "react";
import { GuideSections, Preview } from "../../guide/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../guide/tables.js";
import { capitalize } from "../../guide/text.js";
import {
  buttonKeyboardRows,
  buttonPropRows,
  buttonSections,
  COLORS,
  VARIANTS,
} from "./button-docs-examples.js";

/** Stands in for a router's link component in the routing preview. */
function PreviewLink({ to, ...props }: { to: string } & ComponentProps<"a">) {
  return <a href={to} {...props} />;
}

function MailIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function VariantsPreview() {
  return (
    <Preview>
      {VARIANTS.map((variant) => (
        <Button key={variant} variant={variant} color="primary">
          {capitalize(variant)}
        </Button>
      ))}
    </Preview>
  );
}

function ColorsPreview() {
  return (
    <Preview>
      <Button variant="contained">Inherit</Button>
      {COLORS.map((color) => (
        <Button key={color} variant="contained" color={color}>
          {capitalize(color)}
        </Button>
      ))}
    </Preview>
  );
}

function SizesPreview() {
  return (
    <Preview className="flex-col items-stretch!">
      <div className="flex flex-wrap items-center gap-3">
        {(["sm", "md", "lg", "xl"] as const).map((size) => (
          <Button key={size} variant="contained" color="primary" size={size}>
            {size.toUpperCase()}
          </Button>
        ))}
      </div>
      <Button variant="contained" color="primary" fullWidth>
        Full width
      </Button>
    </Preview>
  );
}

export const buttonPreviews: Record<string, () => ReactNode> = {
  overview: () => (
    <Preview>
      <Button variant="contained" color="primary">
        Save
      </Button>
      <Button variant="outlined">Cancel</Button>
    </Preview>
  ),
  variants: VariantsPreview,
  colors: ColorsPreview,
  sizes: SizesPreview,
  icons: () => (
    <Preview>
      <Button variant="contained" color="primary" startIcon={<MailIcon />}>
        Send
      </Button>
      <Button variant="outlined" color="primary" endIcon={<MailIcon />}>
        Send
      </Button>
    </Preview>
  ),
  loading: () => (
    <Preview>
      <Button variant="contained" color="primary" loading>
        Saving
      </Button>
      <Button
        variant="contained"
        color="primary"
        loading
        loadingPosition="start"
        startIcon={<MailIcon />}
      >
        Sending
      </Button>
    </Preview>
  ),
  link: () => (
    <Preview>
      <Button variant="outlined" href="#read-the-docs">
        Read the docs
      </Button>
    </Preview>
  ),
  routing: () => (
    <Preview>
      <Button component={PreviewLink} to="#docs-settings" variant="contained">
        Settings
      </Button>
    </Preview>
  ),
  options: () => <OptionsTable schema={buttonOptions} />,
  props: () => <PropsTable label="Button content props" rows={buttonPropRows} />,
  keyboard: () => <KeyboardTable rows={buttonKeyboardRows} />,
};

/** The Button usage guide: its sections with live previews (the host adds the page title). */
export function ButtonGuide() {
  return <GuideSections sections={buttonSections} previews={buttonPreviews} />;
}
