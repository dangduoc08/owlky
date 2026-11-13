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

/** Solar's letter icon (`letter-linear`): the drawing of `MAIL_SVG` and the React examples. */
function MailIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5">
        <path d="M2 12C2 8.22876 2 6.34315 3.17157 5.17157C4.34315 4 6.22876 4 10 4H14C17.7712 4 19.6569 4 20.8284 5.17157C22 6.34315 22 8.22876 22 12C22 15.7712 22 17.6569 20.8284 18.8284C19.6569 20 17.7712 20 14 20H10C6.22876 20 4.34315 20 3.17157 18.8284C2 17.6569 2 15.7712 2 12Z" />
        <path d="M6 8L8.1589 9.79908C9.99553 11.3296 10.9139 12.0949 12 12.0949C13.0861 12.0949 14.0045 11.3296 15.8411 9.79908L18 8" />
      </g>
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
