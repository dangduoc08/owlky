import { breadcrumbsOptions } from "@owlky/core";
import { Breadcrumbs, BreadcrumbsDot, Button, Typography } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import { DemoIcon } from "../shared/demo-icon.js";
import type { GroupFiles } from "../shared/snippets.js";

/** A trail with a dot separator and icons; the current page comes last. */
function DotTrail({ label }: { label: string }) {
  return (
    <Breadcrumbs separator={<BreadcrumbsDot />} aria-label={label}>
      <a href="#home">
        <DemoIcon name="home" />
        Home
      </a>
      <a href="#products">
        <DemoIcon name="cube" />
        Products
      </a>
      <a href="#products-lamps">
        <DemoIcon name="cube" />
        Lamps
      </a>
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
 * `packages/html/src/components/breadcrumbs/examples/<story>-<file>.html`. The page heading's
 * wrapper, `h4` and paragraph are story-only demo markup (`.storybook/preview.css`).
 */
export const breadcrumbsStories: Record<string, ReactGroup[]> = {
  text: [
    {
      title: "Text",
      content: (
        <Breadcrumbs>
          <a href="#home">Home</a>
          <a href="#catalog">Catalog</a>
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
          <a href="#home">
            <DemoIcon name="home" />
            Home
          </a>
          <a href="#catalog">
            <DemoIcon name="cube" />
            Catalog
          </a>
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
              <a href="#products">
                <DemoIcon name="chevronLeft" />
                <span className="sr-only">Back to products</span>
              </a>
              Desk lamp
            </Typography>
            <Button variant="contained" color="inherit" startIcon={<DemoIcon name="plus" />}>
              Add product
            </Button>
          </div>
          <DotTrail label="page breadcrumb" />
          <Typography variant="body2" color="textSecondary">
            {"Read the "}
            <a href="#guide-spacing">spacing guide</a>
            {" and the "}
            <a href="#guide-overflow">overflow guide</a>.
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
