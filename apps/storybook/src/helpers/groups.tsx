import type { OptionSchema } from "@owlky/core";
import type { StoryObj } from "@storybook/react-vite";
import { type ReactNode, useLayoutEffect, useRef } from "react";
import { applyArgs } from "./apply-args.js";
import { applyHtmlArgs, schemaControls } from "./controls.js";
import { jsxSource } from "./jsx-source.js";

/*
 * Story layout shared by React and HTML stories, so both render identical DOM (parity tests):
 * titled groups, each a wrapping row of examples.
 */

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="sb-group">
      <h3 className="sb-group-title">{title}</h3>
      {children}
    </section>
  );
}

export interface ReactGroup {
  title: string;
  content: ReactNode;
}

/** React story body: titled groups of examples. */
export function Groups({ groups }: { groups: ReactGroup[] }) {
  return (
    <div className="sb-groups">
      {groups.map((group) => (
        <Group key={group.title} title={group.title}>
          <div className="sb-row">{group.content}</div>
        </Group>
      ))}
    </div>
  );
}

/**
 * Story Controls (ADR-0015): options of `schema`, applied to every example — as props of `target`
 * in React, as attributes in HTML.
 */
export interface StoryControls {
  schema: OptionSchema;
  keys: readonly string[];
  /** React: the component (or stateful demo) that receives the props. */
  target?: unknown;
}

/**
 * React story: the groups plus their JSX (with imports) in the Code panel. `controls` adds props
 * that change every example at once (defaults leave the examples untouched). Pass `code` for
 * examples that keep state (their components can't be expanded into JSX).
 */
export function reactGroupsStory(
  groups: ReactGroup[],
  controls?: StoryControls,
  code?: string,
): StoryObj {
  return {
    render: (args) => (
      <Groups
        groups={
          controls
            ? groups.map((group) => ({
                ...group,
                content: applyArgs(group.content, controls.target, args),
              }))
            : groups
        }
      />
    ),
    ...(controls ? { argTypes: schemaControls(controls.schema, controls.keys) } : {}),
    parameters: { docs: { source: { language: "tsx", code: code ?? jsxSource(groups) } } },
  };
}

function HtmlGroups({
  groups,
  controls,
  args,
}: {
  groups: HtmlGroup[];
  controls: StoryControls | undefined;
  args: Record<string, unknown>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (controls && ref.current) applyHtmlArgs(ref.current, controls.schema, args);
  }, [controls, args]);
  return (
    <div ref={ref} className="sb-groups">
      {groups.map((group) => (
        <Group key={group.title} title={group.title}>
          {/* biome-ignore lint/security/noDangerouslySetInnerHtml: trusted, repository-owned snippet files. */}
          <div className="sb-row" dangerouslySetInnerHTML={{ __html: group.html }} />
        </Group>
      ))}
    </div>
  );
}

export interface HtmlGroup {
  title: string;
  /** A canonical snippet from @owlky/html, rendered exactly as users paste it. */
  html: string;
}

/**
 * HTML story: the same groups, each row filled with a canonical snippet. `setup` (what to load:
 * CSS, runtime) heads the code shown in the Code panel.
 */
export function htmlGroupsStory(
  groups: HtmlGroup[],
  setup = "",
  controls?: StoryControls,
): StoryObj {
  return {
    render: (args) => (
      // A new key per args value re-inserts pristine snippets before the args are written.
      <HtmlGroups key={JSON.stringify(args)} groups={groups} controls={controls} args={args} />
    ),
    ...(controls ? { argTypes: schemaControls(controls.schema, controls.keys) } : {}),
    parameters: {
      docs: {
        source: {
          language: "html",
          code: [
            setup.trim(),
            ...groups.map((group) => `<!-- ${group.title} -->\n${group.html.trim()}`),
          ]
            .filter(Boolean)
            .join("\n\n"),
        },
      },
    },
  };
}

/** Ways to use a component; the toolbar's Framework menu picks one (global `framework`, ADR-0018). */
export type Framework = "html" | "react";
export const DEFAULT_FRAMEWORK: Framework = "react";

/** The framework a `framework` global names, or the default. */
export const toFramework = (value: unknown): Framework =>
  value === "html" || value === "react" ? value : DEFAULT_FRAMEWORK;

const frameworkOf = (globals: Record<string, unknown>): Framework =>
  toFramework(globals["framework"]);

const sourceOf = (story: StoryObj) =>
  (story.parameters?.["docs"] as { source?: { code?: string } } | undefined)?.source?.code ?? "";

/**
 * One story for every framework (ADR-0018): renders the implementation chosen in the toolbar,
 * with the same Controls, and shows that implementation's source in the Code panel.
 */
export function frameworkStory(stories: Record<Framework, StoryObj>): StoryObj {
  const { html, react } = stories;
  return {
    ...(html.name !== undefined || react.name !== undefined
      ? { name: react.name ?? html.name }
      : {}),
    render: (args, context) => {
      const story = stories[frameworkOf(context.globals)];
      return story.render?.(args, context) as ReturnType<NonNullable<StoryObj["render"]>>;
    },
    argTypes: { ...html.argTypes, ...react.argTypes },
    parameters: {
      docs: {
        source: {
          language: "tsx",
          // No static `code`: Storybook applies `transform` (with the current globals) only to a
          // derived source.
          transform: (_code: string, context: { globals: Record<string, unknown> }) =>
            sourceOf(stories[frameworkOf(context.globals)]),
        },
      },
    },
  };
}
