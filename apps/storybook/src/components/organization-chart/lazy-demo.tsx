import { OrganizationChart, OrganizationChartNode, Scrollbar } from "@owlky/react";
import { CEO, PEOPLE, type PersonNode } from "./organization-chart-data.js";
import { SimpleCard } from "./organization-chart-examples.js";

/** One person and, below them, their reports. */
function PersonNodeItem({ person }: { person: PersonNode }) {
  return (
    <OrganizationChartNode
      nodeId={person.id}
      toggleLabel={`${person.name}'s reports`}
      label={<SimpleCard person={person} />}
    >
      {person.children?.map((child) => (
        <PersonNodeItem key={child.id} person={child} />
      ))}
    </OrganizationChartNode>
  );
}

/** The reports of a lead, as nodes (what a server would answer). */
export function reportsOf(id: string) {
  const lead = PEOPLE.find((person) => person.id === id);
  return (lead?.children ?? []).map((person) => <PersonNodeItem key={person.id} person={person} />);
}

/** Answers after a short delay, like a request. */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Lazy children: the leads' reports load on their first expand. */
export function LazyChartDemo() {
  return (
    <Scrollbar
      className="sb-org-scroll"
      aria-label="Organization chart with lazy children, scrollable"
    >
      <OrganizationChart
        id="org-lazy"
        aria-label="Organization chart with lazy children"
        enableExpandCollapse
        lineColor="primary"
        lineHeight={20}
        nodeId={CEO.id}
        toggleLabel={`${CEO.name}'s reports`}
        label={<SimpleCard person={CEO} />}
        loadChildren={async ({ id }) => {
          await delay(800);
          return reportsOf(id);
        }}
      >
        {PEOPLE.map((lead) => (
          <OrganizationChartNode
            key={lead.id}
            nodeId={lead.id}
            hasChildren
            toggleLabel={`${lead.name}'s reports`}
            label={<SimpleCard person={lead} />}
          />
        ))}
      </OrganizationChart>
    </Scrollbar>
  );
}
