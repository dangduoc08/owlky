import {
  Button,
  Card,
  Checkbox,
  Label,
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
import type { ReactNode } from "react";
import { HighlightedCode } from "../highlight.js";
import { CodeTabs } from "./code-tabs.js";
import { CodeIcon, PaletteIcon, PersonIcon, SparkIcon, TerminalIcon } from "./icons.js";
import { CONTAINER, InlineCode, SectionHeading } from "./section-heading.js";
import { ThemeControls } from "./theme-controls.js";

/* "Why Owlky": four feature cards, each with a live piece of UI. */

function BentoCard({
  id,
  tag,
  icon,
  title,
  text,
  demo,
  className = "",
}: {
  id: string;
  tag: string;
  icon: ReactNode;
  title: string;
  text: string;
  demo: ReactNode;
  className?: string;
}) {
  return (
    <Card
      variant="outlined"
      data-landing-bento=""
      className={className}
      aria-labelledby={id}
      component="article"
    >
      <div className="flex flex-col items-start gap-3 p-6 md:p-8">
        <Label color="primary" startIcon={icon}>
          {tag}
        </Label>
        <Typography variant="h4" component="h3" id={id} className="m-0" data-landing-anchor="">
          {title}
        </Typography>
        <Typography
          variant="body1"
          color="textSecondary"
          component="p"
          className="m-0 max-w-[36rem]"
        >
          <InlineCode>{text}</InlineCode>
        </Typography>
      </div>
      <div data-landing-bento-demo="">{demo}</div>
    </Card>
  );
}

const KEYBOARD = [
  { name: "Menu", keys: "Arrow keys, Home, End, typeahead", checked: true },
  { name: "Dialog", keys: "Esc closes, focus stays inside", checked: true },
  { name: "Data grid", keys: "Arrow keys move between cells", checked: false },
] as const;

function AccessibleDemo() {
  return (
    <Paper variant="outlined" data-landing-inset="">
      <TableContainer>
        <Scrollbar aria-label="Keyboard support">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox aria-label="Select every component" indeterminate />
                </TableCell>
                <TableCell>Component</TableCell>
                <TableCell>Keyboard</TableCell>
                <TableCell>Contrast</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {KEYBOARD.map((row) => (
                <TableRow key={row.name} selected={row.checked}>
                  <TableCell padding="checkbox">
                    <Checkbox aria-label={`Select ${row.name}`} defaultChecked={row.checked} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" component="span">
                      {row.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.keys}</TableCell>
                  <TableCell>
                    <Label color="success">AA</Label>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>
    </Paper>
  );
}

const HTML_SAMPLE = `<button type="button" data-ok-button
  data-ok-variant="contained" data-ok-color="primary">
  Save changes
</button>`;

const REACT_SAMPLE = `import { Button } from "@owlky/react";

export function Save() {
  return (
    <Button variant="contained" color="primary">
      Save changes
    </Button>
  );
}`;

function MarkupDemo() {
  return (
    <div data-landing-inset="" className="flex flex-col gap-4">
      <CodeTabs
        id="landing-code"
        panels={[
          {
            label: "HTML",
            code: <HighlightedCode code={HTML_SAMPLE} language="html" label="Button in HTML" />,
          },
          {
            label: "React",
            code: <HighlightedCode code={REACT_SAMPLE} language="tsx" label="Button in React" />,
          },
        ]}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Typography variant="body2" color="textSecondary" component="span">
          Both render this button:
        </Typography>
        <Button variant="contained" color="primary">
          Save changes
        </Button>
      </div>
    </div>
  );
}

const TOOLS = [
  ["list_components", "Find components"],
  ["get_component", "Options, anatomy, keyboard"],
  ["get_examples", "HTML and React code"],
  ["search_tokens", "CSS variables and utilities"],
  ["get_guide", "Usage guides"],
  ["validate_markup", "Check the markup it wrote"],
] as const;

function AgentDemo() {
  return (
    <Paper data-landing-terminal="" data-ok-theme="dark" variant="outlined" data-landing-inset="">
      <div data-landing-window-bar="">
        <span data-landing-window-dots="" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <Typography variant="caption" color="textSecondary" component="span">
          Terminal
        </Typography>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <code data-landing-command="">
          <span aria-hidden="true">$ </span>claude mcp add --transport http owlky
          https://owlky.com/mcp
        </code>
        <Typography variant="caption" color="textSecondary" component="p" className="m-0">
          Tools your agent can call:
        </Typography>
        <ul className="m-0 grid list-none gap-2 p-0">
          {TOOLS.map(([tool, text]) => (
            <li key={tool} className="flex flex-wrap items-baseline gap-x-3">
              <code data-landing-tool="">{tool}</code>
              <Typography variant="caption" color="textSecondary" component="span">
                {text}
              </Typography>
            </li>
          ))}
        </ul>
      </div>
    </Paper>
  );
}

export function Bento() {
  return (
    <section aria-labelledby="why" data-landing-section="" className={CONTAINER}>
      <SectionHeading
        id="why"
        tag="Why Owlky"
        icon={<SparkIcon />}
        title="Build dashboards faster, for everyone"
      >
        Accessible components, themes you can change in one line and the same markup in every
        framework. Owlky handles the details, so you can focus on your product.
      </SectionHeading>
      <div data-landing-bento-grid="">
        <BentoCard
          id="accessible"
          tag="Accessibility"
          icon={<PersonIcon />}
          title="Accessible by default"
          text="Components follow the WAI-ARIA patterns, work with the keyboard and meet WCAG 2.2 level AA in light and dark themes. Try Tab and Space on the checkboxes."
          demo={<AccessibleDemo />}
          className="lg:col-span-7"
        />
        <BentoCard
          id="themes"
          tag="Theming"
          icon={<PaletteIcon />}
          title="Themes and tokens"
          text="Every color, radius and shadow is a CSS variable, so your brand is a few overrides. Turn on dark mode to see this page change."
          demo={
            <div data-landing-inset="" className="p-6">
              <ThemeControls />
            </div>
          }
          className="lg:col-span-5"
        />
        <BentoCard
          id="ai-ready"
          tag="AI-ready"
          icon={<TerminalIcon />}
          title="Made for AI coding agents"
          text="The Owlky MCP server gives agents the exact options, examples and tokens, and checks their markup. Connect by URL and sign in with GitHub or Google."
          demo={<AgentDemo />}
          className="lg:col-span-5"
        />
        <BentoCard
          id="one-markup"
          tag="One markup"
          icon={<CodeIcon />}
          title="HTML and React from one markup"
          text="React components render the same `data-ok-*` markup as the HTML snippets. One stylesheet styles both, and one behavior core runs both."
          demo={<MarkupDemo />}
          className="lg:col-span-7"
        />
      </div>
    </section>
  );
}
