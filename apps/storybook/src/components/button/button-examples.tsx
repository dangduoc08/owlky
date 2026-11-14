import { buttonOptions } from "@owlky/core";
import { Button, type ButtonVariant } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import { SolarIcon } from "../../helpers/solar-icons.js";

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
          <div data-ok-theme="light">
            <Button variant={variant} color="black">
              Black
            </Button>
          </div>
          <div data-ok-theme="dark">
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
          <Button variant={variant} color="error" startIcon={<SolarIcon name="letter-linear" />}>
            Icon left
          </Button>
          <Button variant={variant} color="error" endIcon={<SolarIcon name="letter-linear" />}>
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
            startIcon={<SolarIcon name="letter-linear" />}
          >
            Start
          </Button>
          <Button
            variant={variant}
            size="lg"
            loading
            loadingPosition="end"
            endIcon={<SolarIcon name="letter-linear" />}
          >
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
          startIcon={<SolarIcon name="letter-linear" />}
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
          endIcon={<SolarIcon name="letter-linear" />}
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

/** Story Controls shared by the React and HTML stories (ADR-0015). */
export const BUTTON_CONTROLS = {
  schema: buttonOptions,
  keys: ["size", "disabled", "fullWidth", "disableElevation"],
} as const;
