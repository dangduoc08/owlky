import {
  Avatar,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chart,
  Label,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Scrollbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@owlky/react";
import type { ComponentType, SVGProps } from "react";
import {
  BagIcon,
  ChartIcon,
  HomeIcon,
  LayersIcon,
  SearchIcon,
  SettingsIcon,
  SparkIcon,
  UsersIcon,
} from "./icons.js";

/*
 * The hero's dashboard preview: an app window built only from Owlky components, with sample data.
 * Phones show the stats and the chart; the sidebar and the table join as the window gets wider.
 */

const NAV: [string, ComponentType<SVGProps<SVGSVGElement>>][] = [
  ["Overview", HomeIcon],
  ["Analytics", ChartIcon],
  ["Orders", BagIcon],
  ["Customers", UsersIcon],
  ["Products", LayersIcon],
  ["Settings", SettingsIcon],
];

const STATS = [
  { label: "Revenue", value: "$48.2k", change: "+12.4%", up: true },
  { label: "Orders", value: "1,284", change: "+4.1%", up: true },
  { label: "Refunds", value: "36", change: "−1.8%", up: false },
] as const;

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];

const ORDERS = [
  {
    name: "Ava Lee",
    initials: "AL",
    color: "primary",
    plan: "Team plan",
    total: "$1,240",
    status: "Paid",
  },
  {
    name: "Noah Kim",
    initials: "NK",
    color: "info",
    plan: "Starter plan",
    total: "$320",
    status: "Pending",
  },
  {
    name: "Mia Chen",
    initials: "MC",
    color: "warning",
    plan: "Team plan",
    total: "$980",
    status: "Paid",
  },
  {
    name: "Leo Park",
    initials: "LP",
    color: "secondary",
    plan: "Enterprise",
    total: "$4,600",
    status: "Refunded",
  },
] as const;

const STATUS_COLOR = { Paid: "success", Pending: "warning", Refunded: "error" } as const;

export function DashboardPreview() {
  return (
    <figure data-landing-window="" className="m-0">
      <Paper variant="outlined" data-landing-window-paper="">
        <div data-landing-window-bar="">
          <span data-landing-window-dots="" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <Typography variant="caption" color="textSecondary" component="span">
            app.example.com/overview
          </Typography>
        </div>
        <div data-landing-app="">
          <div data-landing-app-nav="">
            <Typography variant="subtitle2" component="p" className="m-0 mb-3 px-3">
              Acme Analytics
            </Typography>
            <List dense>
              {NAV.map(([label, Icon], index) => (
                <ListItem key={label} disablePadding>
                  <ListItemButton
                    selected={index === 0}
                    aria-current={index === 0 ? "page" : undefined}
                  >
                    <ListItemIcon>
                      <Icon />
                    </ListItemIcon>
                    <ListItemText primary={label} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </div>
          <div data-landing-app-main="">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 text-text-secondary">
                <SearchIcon />
                <Typography variant="body2" color="textSecondary" component="span">
                  Search
                </Typography>
              </span>
              <Avatar
                size={32}
                color="primary"
                className="ms-auto"
                aria-label="Signed in as Jo Doe"
                role="img"
              >
                JD
              </Avatar>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Typography variant="h5" component="p" className="m-0">
                Overview
              </Typography>
              <Button variant="contained" size="sm" startIcon={<SparkIcon />}>
                New report
              </Button>
            </div>
            <div data-landing-stats="">
              {STATS.map((stat) => (
                <Card key={stat.label} variant="outlined">
                  <CardContent className="flex flex-col gap-1">
                    <Typography
                      variant="subtitle2"
                      color="textSecondary"
                      component="p"
                      className="m-0"
                    >
                      {stat.label}
                    </Typography>
                    <Typography variant="h4" component="p" className="m-0">
                      {stat.value}
                    </Typography>
                    <span className="flex items-center gap-2">
                      <Label color={stat.up ? "success" : "error"}>{stat.change}</Label>
                      <Typography variant="caption" color="textSecondary" component="span">
                        vs last month
                      </Typography>
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div data-landing-panels="">
              <Card variant="outlined" data-landing-chart-card="">
                <CardHeader
                  title="Monthly revenue"
                  subheader="Sample data, in thousands of dollars"
                />
                <CardContent>
                  <Chart
                    label="Monthly revenue, this year and last year"
                    type="area"
                    height={232}
                    colors={["primary", "warning"]}
                    series={[
                      { name: "This year", data: [18, 24, 22, 31, 29, 38, 41, 39, 48] },
                      { name: "Last year", data: [14, 16, 19, 18, 23, 25, 24, 30, 33] },
                    ]}
                    categories={MONTHS}
                    valuePrefix="$"
                    valueSuffix="k"
                  />
                </CardContent>
              </Card>
              <Card variant="outlined" data-landing-orders="">
                <CardHeader title="Recent orders" />
                <TableContainer>
                  <Scrollbar aria-label="Recent orders">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Customer</TableCell>
                          <TableCell align="right">Total</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {ORDERS.map((order) => (
                          <TableRow key={order.name}>
                            <TableCell>
                              <span className="flex items-center gap-2">
                                <Avatar size={28} color={order.color} aria-hidden="true">
                                  {order.initials}
                                </Avatar>
                                <span className="flex flex-col">
                                  <Typography variant="subtitle2" component="span">
                                    {order.name}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="textSecondary"
                                    component="span"
                                  >
                                    {order.plan}
                                  </Typography>
                                </span>
                              </span>
                            </TableCell>
                            <TableCell align="right">{order.total}</TableCell>
                            <TableCell>
                              <Label color={STATUS_COLOR[order.status]}>{order.status}</Label>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Scrollbar>
                </TableContainer>
              </Card>
            </div>
          </div>
        </div>
      </Paper>
      <figcaption className="sr-only">
        A sample dashboard built from Owlky components: List, Card, Label, Chart, Table, Avatar and
        Button. The data is made up.
      </figcaption>
    </figure>
  );
}
