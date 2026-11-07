import type { OptionSchema, OptionSpec } from "@owlky/core";
import type { ReactNode } from "react";

/*
 * Reference tables for component docs pages (ADR-0019). The Options table is generated from the
 * component's option schema (ADR-0015), so it can't drift from the code.
 */

const Code = ({ children }: { children: ReactNode }) => (
  <code className="rounded bg-neutral px-1 py-0.5 font-mono text-[0.8125rem]">{children}</code>
);

/** Text with `inline code` (schema descriptions use backticks). */
const Rich = ({ text }: { text: string }) => (
  <>
    {text.split("`").map((part, i) =>
      // biome-ignore lint/suspicious/noArrayIndexKey: static text fragments.
      i % 2 ? <Code key={i}>{part}</Code> : <span key={i}>{part}</span>,
    )}
  </>
);

/** A horizontally scrollable, keyboard-reachable table frame (axe scrollable-region-focusable). */
function TableFrame({
  label,
  wide = true,
  children,
}: {
  label: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={label}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: scrollable regions must be keyboard-reachable.
      tabIndex={0}
      className="sb-unstyled mb-4 overflow-x-auto rounded-xl border border-solid border-divider"
    >
      <table
        className={`w-full border-collapse text-left text-[0.875rem] ${wide ? "min-w-[40rem]" : ""}`}
      >
        {children}
      </table>
    </section>
  );
}

const th = "border-0 border-b border-solid border-divider bg-neutral px-3 py-2 font-semibold";
const td = "border-0 border-b border-solid border-divider px-3 py-2 align-top";

function htmlOf(schema: OptionSchema, spec: OptionSpec): ReactNode {
  const where = spec.children ? ` on each ${spec.children.replace(":scope > ", "")}` : "";
  switch (spec.kind) {
    case "style":
      return (
        <>
          <Code>{`${spec.attr}="…"`}</Code>
          {where}
        </>
      );
    case "flag":
    case "native":
      return (
        <>
          <Code>{spec.attr}</Code>
          {where}
        </>
      );
    case "number":
      return <Code>{`${spec.attr}="…"`}</Code>;
    case "behavior":
      return (
        <>
          <Code>{`${spec.attr}="false"`}</Code> turns it off
        </>
      );
    default:
      return (
        <>
          <Code>{spec.attr}</Code>
          {spec.event ? (
            <>
              {" "}
              and the <Code>{`ok:${schema.name}:${spec.event}`}</Code> event
            </>
          ) : null}
        </>
      );
  }
}

function valuesOf(spec: OptionSpec): ReactNode {
  if (spec.kind === "style")
    return spec.values.map((value, i) => (
      <span key={value}>
        {i > 0 ? " " : null}
        <Code>{value}</Code>
      </span>
    ));
  if (spec.kind === "number")
    return spec.units ? `Number (px) or a length in ${spec.units.join(", ")}` : "Number";
  return spec.kind === "state" ? "State" : "Boolean";
}

function defaultOf(spec: OptionSpec): ReactNode {
  if (spec.kind === "style") return spec.optional ? "None" : <Code>{spec.default}</Code>;
  if (spec.kind === "behavior") return spec.default ? "On" : "Off";
  if (spec.kind === "state") return "None";
  if (spec.kind === "number")
    return spec.default === undefined ? "None" : <Code>{spec.default}</Code>;
  return "Off";
}

/** Every option of a component: React prop, HTML attribute, values, default and description. */
export function OptionsTable({ schema }: { schema: OptionSchema }) {
  return (
    <TableFrame label={`${schema.name} options`}>
      <thead>
        <tr>
          {["React prop", "HTML attribute", "Values", "Default", "Description"].map((title) => (
            <th key={title} scope="col" className={th}>
              {title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Object.entries(schema.options).map(([key, spec]) => (
          <tr key={key} data-docs-option={key}>
            <td className={td}>
              <Code>{key}</Code>
            </td>
            <td className={td}>{htmlOf(schema, spec)}</td>
            <td className={td}>{valuesOf(spec)}</td>
            <td className={td}>{defaultOf(spec)}</td>
            <td className={td}>
              <Rich text={spec.description} />
              {spec.when ? (
                <>
                  {" "}
                  Only with <Code>{spec.when}</Code>.
                </>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </TableFrame>
  );
}

/** Extra rows for props or attributes that aren't schema options (content, links, callbacks). */
export function PropsTable({
  label,
  rows,
}: {
  label: string;
  rows: { react?: string; html?: string; type: string; description: string }[];
}) {
  return (
    <TableFrame label={label}>
      <thead>
        <tr>
          {["React prop", "HTML", "Type", "Description"].map((title) => (
            <th key={title} scope="col" className={th}>
              {title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.react ?? row.html}>
            <td className={td}>{row.react ? <Code>{row.react}</Code> : "None"}</td>
            <td className={td}>{row.html ? <Code>{row.html}</Code> : "None"}</td>
            <td className={td}>
              <Code>{row.type}</Code>
            </td>
            <td className={td}>
              <Rich text={row.description} />
            </td>
          </tr>
        ))}
      </tbody>
    </TableFrame>
  );
}

/** Keys and what they do. */
export function KeyboardTable({ rows }: { rows: [keys: string, action: string][] }) {
  return (
    <TableFrame label="Keyboard interactions" wide={false}>
      <thead>
        <tr>
          <th scope="col" className={th}>
            Key
          </th>
          <th scope="col" className={th}>
            Action
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([keys, action]) => (
          <tr key={keys}>
            <td className={td}>
              {keys.split(" / ").map((key, i) => (
                <span key={key}>
                  {i > 0 ? " or " : null}
                  <kbd className="rounded border border-solid border-divider bg-neutral px-1.5 py-0.5 font-mono text-[0.8125rem]">
                    {key}
                  </kbd>
                </span>
              ))}
            </td>
            <td className={td}>{action}</td>
          </tr>
        ))}
      </tbody>
    </TableFrame>
  );
}
