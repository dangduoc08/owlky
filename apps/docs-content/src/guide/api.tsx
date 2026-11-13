"use client";

import { Typography } from "@owlky/react";
import type { ReactNode } from "react";
import type {
  ApiCssVariable,
  ApiEntry,
  ApiEvent,
  ApiImports,
  ApiMethod,
  ApiOption,
  ApiPart,
  ApiProp,
  ApiReferenceData,
  ApiType,
} from "./api-data.js";
import { useGuideHost } from "./host.js";
import { Code, Rich, TableFrame, td, th } from "./tables.js";

/*
 * The "API reference" section of a component docs page (ADR-0049): every React prop, HTML
 * attribute, part, event, method, type and CSS variable of the component and each of its parts,
 * from the generated `src/api/<component>.json`. Tables scroll on their own at phone width (a
 * focusable region, axe `scrollable-region-focusable`). Rows carry `data-docs-api-row` for the
 * completeness tests (e2e/tests/foundations.spec.ts).
 */

/** The name column: names stay on one line (the table scrolls instead). */
const first = `${td} whitespace-nowrap`;

const None = () => <span className="text-text-secondary">None</span>;

/** Type text: wraps anywhere, so long unions don't widen the table. */
const TypeText = ({ text }: { text: string }) => (
  <code className="rounded bg-neutral px-1 py-0.5 font-mono text-[0.8125rem] [overflow-wrap:anywhere]">
    {text}
  </code>
);

function Table({
  label,
  columns,
  children,
}: {
  label: string;
  columns: readonly string[];
  children: ReactNode;
}) {
  return (
    <TableFrame label={label}>
      <thead>
        <tr>
          {columns.map((title) => (
            <th key={title} scope="col" className={th}>
              {title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </TableFrame>
  );
}

const Heading = ({ children }: { children: ReactNode }) => (
  <Typography variant="subtitle2" component="h4" className="mt-4 mb-2">
    {children}
  </Typography>
);

function PropsTable({ entry, props }: { entry: ApiEntry; props: readonly ApiProp[] }) {
  return (
    <Table label={`${entry.name} React props`} columns={["Prop", "Type", "Default", "Description"]}>
      {props.map((prop) => (
        <tr key={prop.name} data-docs-api-row={`prop:${entry.name}:${prop.name}`}>
          <td className={first}>
            <Code>{prop.name}</Code>
          </td>
          <td className={td}>
            <TypeText text={prop.type} />
          </td>
          <td className={td}>
            {prop.required ? "Required" : prop.default ? <Code>{prop.default}</Code> : <None />}
          </td>
          <td className={td}>
            <Rich text={prop.description} />
          </td>
        </tr>
      ))}
    </Table>
  );
}

function optionValues(option: ApiOption): ReactNode {
  switch (option.kind) {
    case "style":
      return (option.values ?? []).map((value, i) => (
        <span key={value}>
          {i > 0 ? " " : null}
          <Code>{value}</Code>
        </span>
      ));
    case "number":
      return option.units
        ? `A number (px) or a length in ${option.units.join(", ")}`
        : option.min !== undefined
          ? `A number, at least ${option.min}`
          : "A number";
    case "behavior":
      return (
        <>
          <Code>false</Code> turns it off
        </>
      );
    case "state":
      return "State";
    default:
      return "Present or absent";
  }
}

function optionDefault(option: ApiOption): ReactNode {
  if (option.kind === "style") return option.optional ? <None /> : <Code>{option.default}</Code>;
  if (option.kind === "behavior") return option.default ? "On" : "Off";
  if (option.kind === "number")
    return option.default === undefined ? <None /> : <Code>{option.default}</Code>;
  if (option.kind === "state") return <None />;
  return "Absent";
}

function OptionsTable({ entry, options }: { entry: ApiEntry; options: readonly ApiOption[] }) {
  return (
    <Table
      label={`${entry.name} HTML attributes`}
      columns={["Attribute", "React prop", "Values", "Default", "Description"]}
    >
      {options.map((option) => (
        <tr key={option.name} data-docs-api-row={`option:${entry.name}:${option.name}`}>
          <td className={first}>
            <Code>{option.attr}</Code>
          </td>
          <td className={td}>
            <Code>{option.name}</Code>
          </td>
          <td className={td}>{optionValues(option)}</td>
          <td className={td}>{optionDefault(option)}</td>
          <td className={td}>
            <Rich text={option.description} />
            {option.children ? (
              <>
                {" "}
                Written on each <Code>{option.children.replace(":scope > ", "")}</Code>.
              </>
            ) : null}
            {option.when ? (
              <>
                {" "}
                Only with <Code>{option.when}</Code>.
              </>
            ) : null}
            {option.event ? (
              <>
                {" "}
                Changes fire <Code>{option.event}</Code>.
              </>
            ) : null}
          </td>
        </tr>
      ))}
    </Table>
  );
}

function partKind(part: ApiPart): ReactNode {
  const values = Array.isArray(part.value) ? part.value : [];
  switch (part.kind) {
    case "part":
      return part.elements?.length ? (
        <>
          Element:{" "}
          {part.elements.map((tag, i) => (
            <span key={tag}>
              {i > 0 ? " or " : null}
              <Code>{tag}</Code>
            </span>
          ))}
        </>
      ) : (
        "Element"
      );
    case "state":
      return "State";
    case "trigger":
      return values.includes("id") ? "Trigger: an element's id" : "Trigger";
    default:
      return values.length ? (
        <>
          Value:{" "}
          {values.map((value, i) => (
            <span key={value}>
              {i > 0 ? " " : null}
              <Code>{value}</Code>
            </span>
          ))}
        </>
      ) : (
        "Value: text"
      );
  }
}

function PartsTable({ entry, parts }: { entry: ApiEntry; parts: readonly ApiPart[] }) {
  return (
    <Table label={`${entry.name} parts`} columns={["Attribute", "Kind", "Description"]}>
      {parts.map((part) => (
        <tr key={part.name} data-docs-api-row={`part:${entry.name}:${part.name}`}>
          <td className={first}>
            <Code>{part.name}</Code>
          </td>
          <td className={td}>{partKind(part)}</td>
          <td className={td}>
            <Rich text={part.description} />
          </td>
        </tr>
      ))}
    </Table>
  );
}

const CANCELABLE: Record<string, string> = { true: "Yes", false: "No", sometimes: "Sometimes" };

function EventsTable({ entry, events }: { entry: ApiEntry; events: readonly ApiEvent[] }) {
  return (
    <Table
      label={`${entry.name} events`}
      columns={["Event", "Detail", "Cancelable", "Description"]}
    >
      {events.map((event) => (
        <tr key={event.name} data-docs-api-row={`event:${entry.name}:${event.name}`}>
          <td className={first}>
            <Code>{event.name}</Code>
          </td>
          <td className={td}>
            {event.detail === "undefined" ? <None /> : <TypeText text={event.detail} />}
          </td>
          <td className={td}>{CANCELABLE[String(event.cancelable)] ?? "No"}</td>
          <td className={td}>
            <Rich text={event.description} />
          </td>
        </tr>
      ))}
    </Table>
  );
}

function MethodsTable({ entry, methods }: { entry: ApiEntry; methods: readonly ApiMethod[] }) {
  return (
    <Table label={`${entry.name} methods`} columns={["Member", "Type", "Description"]}>
      {methods.map((method) => (
        <tr key={method.name} data-docs-api-row={`method:${entry.name}:${method.name}`}>
          <td className={first}>
            <Code>{method.kind === "method" ? `${method.name}()` : method.name}</Code>
          </td>
          <td className={td}>
            <TypeText text={method.type} />
          </td>
          <td className={td}>
            <Rich text={method.description} />
          </td>
        </tr>
      ))}
    </Table>
  );
}

function Entry({ entry }: { entry: ApiEntry }) {
  const { react, html } = entry;
  const description = react?.description || html?.description;
  return (
    <div data-docs-api-entry={entry.name}>
      <Typography variant="h6" component="h3" className="mt-8 mb-2">
        {entry.name}
      </Typography>
      {description ? (
        <Typography variant="body2" className="mb-2">
          <Rich text={description} />
        </Typography>
      ) : null}
      {react ? (
        <>
          <Heading>React props</Heading>
          {react.props.length ? <PropsTable entry={entry} props={react.props} /> : null}
          <Typography variant="body2" color="textSecondary" className="mb-2">
            {react.native ? (
              <>
                Other props go to the native element (<Code>{react.native}</Code>), which also
                receives the <Code>ref</Code>.
              </>
            ) : react.ref ? (
              <>
                The <Code>ref</Code> receives the <Code>{react.ref}</Code>.
              </>
            ) : react.props.length ? null : (
              "No props."
            )}
          </Typography>
        </>
      ) : null}
      {html ? (
        <>
          <Heading>HTML</Heading>
          <Typography variant="body2" className="mb-2">
            Marked with <Code>{html.attribute}</Code>
            {html.elements?.length ? (
              <>
                {" "}
                on{" "}
                {html.elements.map((tag, i) => (
                  <span key={tag}>
                    {i > 0 ? " or " : null}
                    <Code>{tag}</Code>
                  </span>
                ))}
              </>
            ) : null}
            .
            {html.runtime ? (
              <>
                {" "}
                Its instance is <Code>{`runtime.get(element, "${html.runtime}")`}</Code>.
              </>
            ) : null}
          </Typography>
          {html.options?.length ? <OptionsTable entry={entry} options={html.options} /> : null}
          {html.parts?.length ? <PartsTable entry={entry} parts={html.parts} /> : null}
          {html.events?.length ? <EventsTable entry={entry} events={html.events} /> : null}
          {html.methods?.length ? <MethodsTable entry={entry} methods={html.methods} /> : null}
        </>
      ) : null}
    </div>
  );
}

function TypesTable({ types }: { types: readonly ApiType[] }) {
  return (
    <Table label="Types" columns={["Type", "Definition"]}>
      {types.map((type) => (
        <tr
          key={`${type.name}:${type.framework ?? ""}`}
          data-docs-api-row={`type:${type.name}${type.framework ? `:${type.framework}` : ""}`}
        >
          <td className={first}>
            <Code>{type.name}</Code>
            {type.framework ? ` (${type.framework === "react" ? "React" : "HTML"})` : null}
          </td>
          <td className={td}>
            <TypeText text={type.type} />
          </td>
        </tr>
      ))}
    </Table>
  );
}

function CssTable({ variables }: { variables: readonly ApiCssVariable[] }) {
  return (
    <Table label="CSS variables" columns={["Variable", "Value", "Description"]}>
      {variables.map((variable) => (
        <tr key={variable.name} data-docs-api-row={`css:${variable.name}`}>
          <td className={first}>
            <Code>{variable.name}</Code>
          </td>
          <td className={td}>
            {variable.value !== undefined ? (
              <TypeText text={variable.value} />
            ) : variable.light !== undefined ? (
              <>
                Light: <TypeText text={variable.light} />
                <br />
                Dark: <TypeText text={variable.dark ?? variable.light} />
              </>
            ) : (
              "Set per color"
            )}
          </td>
          <td className={td}>
            {variable.description ? <Rich text={variable.description} /> : "A design token."}
          </td>
        </tr>
      ))}
    </Table>
  );
}

/** One row of the Import table: a code list and what it is for. */
function ImportRow({
  name,
  label,
  values,
  children,
}: {
  name: string;
  label: string;
  values: readonly string[];
  children: ReactNode;
}) {
  return (
    <tr data-docs-api-row={`import:${name}`}>
      <td className={first}>{label}</td>
      <td className={td}>
        {values.map((value, i) => (
          <span key={value}>
            {i > 0 ? <br /> : null}
            <Code>{value}</Code>
          </span>
        ))}
      </td>
      <td className={td}>{children}</td>
    </tr>
  );
}

/**
 * Where the component comes from (ADR-0068): the per-component entries, the stylesheets and the
 * CDN module, from the reference's `imports` (the same data as the MCP server's `imports`).
 */
function ImportTable({ title, imports }: { title: string; imports: ApiImports }) {
  const { react, html, core, css, cdnModule } = imports;
  return (
    <Table label={`${title} imports`} columns={["Use", "Import", "Description"]}>
      {react ? (
        <ImportRow name="react" label="React" values={[react]}>
          The React components. The <Code>@owlky/react</Code> barrel exports them too, and bundles
          the same code.
        </ImportRow>
      ) : null}
      {html ? (
        <ImportRow name="html" label="HTML" values={[html]}>
          The runtime definitions, without side effects. Register them on the runtime, or import{" "}
          <Code>@owlky/html/auto</Code> to register every component.
        </ImportRow>
      ) : null}
      {core ? (
        <ImportRow name="core" label="Core" values={[core]}>
          The option schema, the attribute helpers and the behavior that both versions share.
        </ImportRow>
      ) : null}
      {css?.length ? (
        <ImportRow name="css" label="CSS" values={css}>
          The component's own styles. Load them after <Code>@owlky/styles/tokens.css</Code>,{" "}
          <Code>@owlky/styles/components/icon.css</Code> and the styles of the components it
          composes. <Code>@owlky/styles/owlky.css</Code> holds every component.
        </ImportRow>
      ) : null}
      <ImportRow
        name="cdn"
        label="CDN"
        values={[cdnModule ? `modules/${cdnModule}.js` : html ? "owlky.js" : "owlky.css"]}
      >
        {cdnModule ? (
          <>
            <Code>owlky.js</Code> loads this module when the page holds the component. To load it
            ahead of use, add <Code>{`data-ok-preload="${cdnModule}"`}</Code> to the script.
          </>
        ) : html ? (
          <>
            Included in <Code>owlky.js</Code>.
          </>
        ) : (
          "CSS only: the component needs no script."
        )}
      </ImportRow>
    </Table>
  );
}

/** The generated API reference of a component and each of its parts. */
export function ApiReference({ data }: { data: ApiReferenceData }) {
  const { unstyledClassName } = useGuideHost();
  return (
    <div className={unstyledClassName} data-docs-api={data.name}>
      {data.imports ? (
        <>
          <Typography variant="h6" component="h3" className="mt-8 mb-2">
            Import
          </Typography>
          <ImportTable title={data.title} imports={data.imports} />
        </>
      ) : null}
      {data.entries.map((entry) => (
        <Entry key={entry.name} entry={entry} />
      ))}
      {data.types?.length ? (
        <>
          <Typography variant="h6" component="h3" className="mt-8 mb-2">
            Types
          </Typography>
          <TypesTable types={data.types} />
        </>
      ) : null}
      {data.css?.length ? (
        <>
          <Typography variant="h6" component="h3" className="mt-8 mb-2">
            CSS variables
          </Typography>
          <CssTable variables={data.css} />
        </>
      ) : null}
    </div>
  );
}
