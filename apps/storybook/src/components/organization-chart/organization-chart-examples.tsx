import { organizationChartOptions } from "@owlky/core";
import {
  OrganizationChart,
  type OrganizationChartLineColor,
  type OrganizationChartLineStyle,
  OrganizationChartNode,
  Scrollbar,
  Typography,
} from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import type { GroupFiles } from "../shared/snippets.js";
import { CEO, PEOPLE, type Person, type PersonNode } from "./organization-chart-data.js";

/** A simple node: the name and the role in a tinted box (`.sb-org-simple`, story CSS). */
function SimpleCard({ person }: { person: Person }) {
  return (
    <div className="sb-org-simple">
      <Typography className="sb-org-name" variant="subtitle2" component="span" noWrap>
        {person.name}
      </Typography>
      <Typography className="sb-org-role" variant="caption" noWrap>
        {person.role}
      </Typography>
    </div>
  );
}
SimpleCard.displayName = "SimpleCard";

/** One person and, below them, their reports. */
function SimpleNode({ person }: { person: PersonNode }) {
  return (
    <OrganizationChartNode label={<SimpleCard person={person} />}>
      {person.children?.map((child) => (
        <SimpleNode key={child.id} person={child} />
      ))}
    </OrganizationChartNode>
  );
}
SimpleNode.displayName = "SimpleNode";

/** A small team for the line examples: a lead, three people, one report. */
const TEAM: PersonNode = {
  id: "lead",
  name: "Team lead",
  role: "Platform",
  avatar: "",
  children: [
    { id: "a", name: "Designer", role: "Product", avatar: "" },
    {
      id: "b",
      name: "Engineer",
      role: "Back end",
      avatar: "",
      children: [{ id: "c", name: "Intern", role: "Back end", avatar: "" }],
    },
    { id: "d", name: "Writer", role: "Content", avatar: "" },
  ],
};

interface LineProps {
  lineHeight?: number | string;
  lineWidth?: number | string;
  lineColor?: OrganizationChartLineColor;
  lineStyle?: OrganizationChartLineStyle;
  lineBorderRadius?: number | string;
  nodePadding?: number | string;
}

/** The small team with the given line options, in a scroll area on narrow screens. */
function TeamChart({ name, ...lines }: LineProps & { name: string }) {
  return (
    <Scrollbar className="sb-org-scroll" aria-label={`${name}, scrollable`}>
      <OrganizationChart aria-label={name} {...lines} label={<SimpleCard person={TEAM} />}>
        {TEAM.children?.map((child) => (
          <SimpleNode key={child.id} person={child} />
        ))}
      </OrganizationChart>
    </Scrollbar>
  );
}
TeamChart.displayName = "TeamChart";

/**
 * Story groups — the same examples as `packages/html/src/components/organization-chart/examples/`
 * (generated from these by `apps/storybook/scripts/organization-chart-snippets.mjs`). Node texts
 * are Typography; `.sb-org-*` classes are story-only layouts.
 */
export const organizationChartStories: Record<string, ReactGroup[]> = {
  simple: [
    {
      title: "Simple",
      content: (
        <Scrollbar className="sb-org-scroll" aria-label="Simple organization chart, scrollable">
          <OrganizationChart
            aria-label="Simple organization chart"
            lineColor="primary"
            lineHeight={20}
            label={<SimpleCard person={CEO} />}
          >
            {PEOPLE.map((person) => (
              <SimpleNode key={person.id} person={person} />
            ))}
          </OrganizationChart>
        </Scrollbar>
      ),
    },
  ],
  lines: [
    {
      title: "Dashed",
      content: <TeamChart name="Dashed lines" lineStyle="dashed" lineColor="primary" />,
    },
    {
      title: "Dotted, square corners",
      content: (
        <TeamChart
          name="Dotted lines"
          lineStyle="dotted"
          lineWidth={2}
          lineColor="secondary"
          lineBorderRadius={0}
        />
      ),
    },
    {
      title: "Thick and colored",
      content: <TeamChart name="Thick lines" lineWidth={2} lineColor="info" lineBorderRadius={8} />,
    },
    {
      title: "Short and spaced",
      content: (
        <TeamChart name="Short lines" lineHeight={12} nodePadding={16} lineColor="inherit" />
      ),
    },
  ],
};

export const ORGANIZATION_CHART_FILES: Record<string, GroupFiles> = {
  simple: [["Simple", "group"]],
  lines: [
    ["Dashed", "dashed"],
    ["Dotted, square corners", "dotted"],
    ["Thick and colored", "thick"],
    ["Short and spaced", "short"],
  ],
};

/** Story Controls shared by the React and HTML stories (ADR-0015). */
export const ORGANIZATION_CHART_CONTROLS = {
  schema: organizationChartOptions,
  keys: ["lineHeight", "lineWidth", "lineColor", "lineStyle", "lineBorderRadius", "nodePadding"],
} as const;
