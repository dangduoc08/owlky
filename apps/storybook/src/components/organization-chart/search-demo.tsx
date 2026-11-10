import {
  Autocomplete,
  OrganizationChart,
  Scrollbar,
  Typography,
  useOrganizationChartApiRef,
} from "@owlky/react";
import { useState } from "react";
import { PersonNodeItem } from "./collapsible-demo.js";
import { CEO, PEOPLE, type PersonNode } from "./organization-chart-data.js";
import { SimpleCard } from "./organization-chart-examples.js";

/** Every person under these nodes, in tree order. */
const everyone = (nodes: PersonNode[]): PersonNode[] =>
  nodes.flatMap((node) => [node, ...everyone(node.children ?? [])]);

/** The search's options: one per person, the node id as the value. */
const PEOPLE_OPTIONS = [CEO, ...everyone(PEOPLE)].map((person) => ({
  value: person.id,
  label: person.name,
}));

/**
 * Lineage highlight and search: hovering or focusing a card highlights its path to the root, and
 * picking a person in the Autocomplete opens the branches above them, scrolls to them and
 * highlights them. A polite status line says what happened.
 */
export function SearchChartDemo() {
  const apiRef = useOrganizationChartApiRef();
  const [status, setStatus] = useState("");
  return (
    <div className="sb-org-demo">
      <Autocomplete
        id="org-search-field"
        className="sb-org-search"
        label="Find a person"
        options={PEOPLE_OPTIONS}
        onChange={(value) => {
          const option = PEOPLE_OPTIONS.find((item) => item.value === value);
          if (option) {
            void apiRef.current?.highlightNode(option.value);
            setStatus(`${option.label} is highlighted in the chart.`);
          } else {
            apiRef.current?.clearHighlight();
            setStatus("");
          }
        }}
      />
      <Typography id="org-search-status" role="status" variant="body2" color="textSecondary">
        {status}
      </Typography>
      <Scrollbar className="sb-org-scroll" aria-label="Searchable organization chart, scrollable">
        <OrganizationChart
          id="org-search"
          aria-label="Searchable organization chart"
          apiRef={apiRef}
          enableExpandCollapse
          highlightOnHover
          defaultCollapsedNodes={["priya", "leila"]}
          lineColor="primary"
          lineHeight={20}
          nodeId={CEO.id}
          toggleLabel={`${CEO.name}'s reports`}
          label={<SimpleCard person={CEO} />}
        >
          {PEOPLE.map((person) => (
            <PersonNodeItem key={person.id} person={person} />
          ))}
        </OrganizationChart>
      </Scrollbar>
    </div>
  );
}
