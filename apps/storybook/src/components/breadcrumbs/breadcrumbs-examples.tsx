import { breadcrumbsOptions } from "@owlky/core";
import { Breadcrumbs, BreadcrumbsDot, Button, Link, Typography } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import { DemoIcon } from "../shared/demo-icon.js";
import type { GroupFiles } from "../shared/snippets.js";

/** A trail with a dot separator and icons; the current page comes last. */
function DotTrail({ label }: { label: string }) {
  return (
    <Breadcrumbs separator={<BreadcrumbsDot />} aria-label={label}>
      <Link href="#home" color="inherit" underline="hover">
        <DemoIcon name="home" />
        Home
      </Link>
      <Link href="#products" color="inherit" underline="hover">
        <DemoIcon name="cube" />
        Products
      </Link>
      <Link href="#products-lamps" color="inherit" underline="hover">
        <DemoIcon name="cube" />
        Lamps
      </Link>
      <span aria-current="page">
        <DemoIcon name="cube" />
        Desk lamp
      </span>
    </Breadcrumbs>
  );
}
DotTrail.displayName = "DotTrail";

/**
 * Story groups — the same examples, in the same order, as the HTML snippets
 * `packages/html/src/components/breadcrumbs/examples/<story>-<file>.html`. Items are Links in the
 * parent's color, underlined on hover (MUI's breadcrumbs); the page heading's wrapper is story-only
 * demo markup (`.storybook/preview.css`).
 */
export const breadcrumbsStories: Record<string, ReactGroup[]> = {
  text: [
    {
      title: "Text",
      content: (
        <Breadcrumbs>
          <Link href="#home" color="inherit" underline="hover">
            Home
          </Link>
          <Link href="#catalog" color="inherit" underline="hover">
            Catalog
          </Link>
          <span aria-current="page">Accessories</span>
        </Breadcrumbs>
      ),
    },
  ],
  "with-icon": [
    {
      title: "With icon",
      content: (
        <Breadcrumbs aria-label="breadcrumb with icons">
          <Link href="#home" color="inherit" underline="hover">
            <DemoIcon name="home" />
            Home
          </Link>
          <Link href="#catalog" color="inherit" underline="hover">
            <DemoIcon name="cube" />
            Catalog
          </Link>
          <span aria-current="page">
            <DemoIcon name="star" />
            Accessories
          </span>
        </Breadcrumbs>
      ),
    },
  ],
  customized: [
    { title: "Dot separator", content: <DotTrail label="breadcrumb" /> },
    {
      title: "Page heading",
      content: (
        <div className="sb-page-heading">
          <div className="sb-page-heading-title">
            <Typography variant="h4" color="textPrimary">
              <Link href="#products" color="inherit" underline="none">
                <DemoIcon name="chevronLeft" />
                <span className="sr-only">Back to products</span>
              </Link>
              Desk lamp
            </Typography>
            <Button variant="contained" color="inherit" startIcon={<DemoIcon name="plus" />}>
              Add product
            </Button>
          </div>
          <DotTrail label="page breadcrumb" />
          <Typography variant="body2" color="textSecondary">
            {"Read the "}
            <Link href="#guide-spacing">spacing guide</Link>
            {" and the "}
            <Link href="#guide-overflow">overflow guide</Link>.
          </Typography>
        </div>
      ),
    },
  ],
};

export const BREADCRUMBS_FILES: Record<string, GroupFiles> = {
  text: [["Text", "group"]],
  "with-icon": [["With icon", "group"]],
  customized: [
    ["Dot separator", "dot"],
    ["Page heading", "heading"],
  ],
};

/** Story Controls shared by the React and HTML stories (ADR-0015). */
export const BREADCRUMBS_CONTROLS = {
  schema: breadcrumbsOptions,
  keys: ["maxItems", "itemsBeforeCollapse", "itemsAfterCollapse"],
} as const;
