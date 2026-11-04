import { Button, type ButtonVariant } from "@minimal-tailwind/react";
import type { ReactGroup } from "../../helpers/groups.js";

/** Decorative icon used by the examples (drawn for this project). */
export const MailIcon = () => (
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
MailIcon.displayName = "MailIcon";

const COLORS = ["inherit", "primary", "secondary", "info", "success", "warning", "error"] as const;
const SIZES = [
  ["sm", "Small"],
  ["md", "Medium"],
  ["lg", "Large"],
  ["xl", "XLarge"],
] as const;

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/**
 * The groups of one variant story — the same examples, in the same order, as the HTML snippets
 * `packages/html/src/components/button/examples/<variant>-<group>.html`.
 */
export function buttonGroups(variant: ButtonVariant): ReactGroup[] {
  return [
    {
      title: "Base",
      content: (
        <>
          <Button variant={variant}>Inherit</Button>
          <Button variant={variant} color="primary">
            Primary
          </Button>
          <Button variant={variant} color="secondary">
            Secondary
          </Button>
          <Button variant={variant} disabled>
            Disabled
          </Button>
          <Button variant={variant} href="/docs">
            Documentation
          </Button>
        </>
      ),
    },
    {
      title: "Colors",
      content: COLORS.map((color) => (
        <Button key={color} variant={variant} color={color}>
          {capitalize(color)}
        </Button>
      )),
    },
    {
      title: "Black & white",
      content: (
        <>
          <div data-mt-theme="light">
            <Button variant={variant} color="black">
              Black
            </Button>
          </div>
          <div data-mt-theme="dark">
            <Button variant={variant} color="white">
              White
            </Button>
          </div>
        </>
      ),
    },
    {
      title: "With icon & loading",
      content: (
        <>
          <Button variant={variant} color="error" startIcon={<MailIcon />}>
            Icon left
          </Button>
          <Button variant={variant} color="error" endIcon={<MailIcon />}>
            Icon right
          </Button>
          <Button variant={variant} loading>
            Submit
          </Button>
          <Button variant={variant} loading loadingIndicator="Loading…">
            Fetch data
          </Button>
          <Button
            variant={variant}
            size="lg"
            loading
            loadingPosition="start"
            startIcon={<MailIcon />}
          >
            Start
          </Button>
          <Button variant={variant} size="lg" loading loadingPosition="end" endIcon={<MailIcon />}>
            End
          </Button>
        </>
      ),
    },
    {
      title: "Sizes",
      content: SIZES.map(([size, label]) => (
        <Button key={size} variant={variant} color="info" size={size}>
          {label}
        </Button>
      )),
    },
    {
      title: "Sizes · loading start",
      content: SIZES.map(([size, label]) => (
        <Button
          key={size}
          variant={variant}
          size={size}
          loading
          loadingPosition="start"
          startIcon={<MailIcon />}
        >
          {label}
        </Button>
      )),
    },
    {
      title: "Sizes · loading end",
      content: SIZES.map(([size, label]) => (
        <Button
          key={size}
          variant={variant}
          size={size}
          loading
          loadingPosition="end"
          endIcon={<MailIcon />}
        >
          {label}
        </Button>
      )),
    },
  ];
}

/** Group titles ↔ snippet file suffixes, in story order. */
export const GROUP_FILES = [
  ["Base", "base"],
  ["Colors", "colors"],
  ["Black & white", "black-white"],
  ["With icon & loading", "icon-loading"],
  ["Sizes", "sizes"],
  ["Sizes · loading start", "sizes-loading-start"],
  ["Sizes · loading end", "sizes-loading-end"],
] as const;
