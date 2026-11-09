"use client";

import {
  Card,
  CardContent,
  CardHeader,
  Chart,
  DataGrid,
  DateCalendar,
  type GridColDef,
  Label,
  Link,
  Tab,
  TabPanel,
  Tabs,
  Typography,
} from "@owlky/react";
import { type ComponentType, type ReactNode, type SVGProps, useState } from "react";
import { componentHref } from "../../content/home.js";
import { ArrowRightIcon, CalendarIcon, ChartIcon, GridIcon } from "./icons.js";

/* "What you get": the large components, one tab each, with a live demo (sample data). */

type Member = {
  id: number;
  name: string;
  team: string;
  tasks: number;
  status: "Active" | "Away" | "Invited";
};

const MEMBERS: Member[] = [
  { id: 1, name: "Ava Lee", team: "Design", tasks: 12, status: "Active" },
  { id: 2, name: "Noah Kim", team: "Engineering", tasks: 31, status: "Active" },
  { id: 3, name: "Mia Chen", team: "Research", tasks: 7, status: "Away" },
  { id: 4, name: "Leo Park", team: "Engineering", tasks: 18, status: "Active" },
  { id: 5, name: "Zoe Diaz", team: "Marketing", tasks: 4, status: "Invited" },
];

const STATUS_COLOR = { Active: "success", Away: "warning", Invited: "default" } as const;

const COLUMNS: GridColDef<Member>[] = [
  { field: "name", headerName: "Name", flex: 1, minWidth: 120 },
  { field: "team", headerName: "Team", flex: 1, minWidth: 120 },
  { field: "tasks", headerName: "Tasks", type: "number", width: 90 },
  {
    field: "status",
    headerName: "Status",
    width: 110,
    renderCell: ({ row }) => <Label color={STATUS_COLOR[row.status]}>{row.status}</Label>,
  },
];

// A fixed month, so the calendar shows the same days on the server and in every browser.
const DAY = new Date(2025, 4, 14);

interface Item {
  id: string;
  label: string;
  component: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  text: string;
  demo: ReactNode;
}

const ITEMS: Item[] = [
  {
    id: "grid",
    label: "Data grid",
    component: "data-grid",
    icon: GridIcon,
    title: "Data grid",
    text: "Sort, filter, select, edit, group and export rows. Pin columns, page or virtualize thousands of rows, and move between cells with the arrow keys.",
    demo: (
      <Card variant="outlined">
        <DataGrid
          id="landing-grid"
          aria-label="Team members (sample data)"
          rows={MEMBERS}
          columns={COLUMNS}
          checkboxSelection
          disableRowSelectionOnClick
          density="compact"
          hideFooter
        />
      </Card>
    ),
  },
  {
    id: "charts",
    label: "Charts",
    component: "chart",
    icon: ChartIcon,
    title: "Charts",
    text: "Lines, areas, columns, pies, radars, heatmaps and more, drawn as SVG in your theme colors. Every chart keeps its data in an accessible table.",
    demo: (
      <Card variant="outlined">
        <CardHeader title="Weekly visitors" subheader="Sample data" />
        <CardContent>
          <Chart
            label="Weekly visitors, new and returning"
            type="bar"
            stacked
            height={260}
            colors={["primary", "info"]}
            series={[
              { name: "New", data: [42, 51, 38, 64, 57, 33, 29] },
              { name: "Returning", data: [28, 34, 31, 40, 45, 22, 18] },
            ]}
            categories={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
          />
        </CardContent>
      </Card>
    ),
  },
  {
    id: "pickers",
    label: "Date pickers",
    component: "date-picker",
    icon: CalendarIcon,
    title: "Date and time pickers",
    text: "Dates, times and ranges in sectioned fields, calendars and clocks. Time zones, locales and other calendar systems are built in.",
    demo: (
      <Card variant="outlined" className="flex justify-center">
        <DateCalendar
          id="landing-calendar"
          aria-label="Pick a date"
          defaultValue={DAY}
          today={DAY}
        />
      </Card>
    ),
  },
];

export function Showcase() {
  const [value, setValue] = useState("grid");
  return (
    <div className="flex flex-col items-center gap-10">
      <Tabs
        value={value}
        onChange={setValue}
        aria-label="Large components"
        segmented
        data-landing-tabs=""
      >
        {ITEMS.map(({ id, label, icon: Icon }) => (
          <Tab
            key={id}
            value={id}
            label={label}
            icon={<Icon />}
            iconPosition="start"
            id={`landing-tab-${id}`}
            aria-controls={`landing-panel-${id}`}
          />
        ))}
      </Tabs>
      {ITEMS.map((item) => (
        <TabPanel
          key={item.id}
          id={`landing-panel-${item.id}`}
          aria-labelledby={`landing-tab-${item.id}`}
          hidden={value !== item.id}
          data-landing-showcase=""
        >
          <div className="flex flex-col items-start gap-4">
            <Label color="primary" variant="soft" startIcon={<item.icon />}>
              {item.label}
            </Label>
            <Typography variant="h3" component="h3" className="m-0">
              {item.title}
            </Typography>
            <Typography variant="body1" color="textSecondary" component="p" className="m-0">
              {item.text}
            </Typography>
            <Link
              href={componentHref(item.component)}
              variant="subtitle2"
              className="inline-flex items-center gap-1"
            >
              Read the {item.label} spec
              <ArrowRightIcon />
            </Link>
          </div>
          <div data-landing-showcase-demo="">{item.demo}</div>
        </TabPanel>
      ))}
    </div>
  );
}
