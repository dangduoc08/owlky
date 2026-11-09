import { Gantt } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory, type StoryControls } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { ganttExamples } from "./gantt-data.js";
import { GanttDocs } from "./gantt-docs.js";
import { GANTT_CONTROLS, GANTT_FILES, ganttCode, ganttStories } from "./gantt-examples.js";

const controls: StoryControls = { ...GANTT_CONTROLS, target: Gantt };

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/gantt/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const SETUP = htmlSetup(["icon-button.css", "gantt.css"], true);

const story = (name: string): StoryObj => ({
  ...frameworkStory({
    html: snippetStory(snippets, name, GANTT_FILES[name] ?? [], SETUP, GANTT_CONTROLS),
    react: reactGroupsStory(
      ganttStories[name] ?? [],
      controls,
      ganttExamples[name] ? ganttCode(ganttExamples[name]) : undefined,
    ),
  }),
  name: ganttExamples[name]?.title ?? name,
});

const meta = {
  title: "Components/Gantt",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: GanttDocs,
      description: {
        component:
          "A Gantt chart shows a project's tasks on a timeline: their dates, progress, hierarchy, milestones and dependencies.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Basic: StoryObj = story("basic");
export const TimelineViews: StoryObj = story("timeline-views");
export const Milestones: StoryObj = story("milestones");
export const DependencyTypes: StoryObj = story("dependency-types");
export const Baseline: StoryObj = story("baseline");
export const CriticalPath: StoryObj = story("critical-path");
export const WorkingCalendar: StoryObj = story("working-calendar");
export const ProjectBoundary: StoryObj = story("project-boundary");
export const BarLabels: StoryObj = story("bar-labels");
export const CustomColors: StoryObj = story("custom-colors");
export const Selection: StoryObj = story("selection");
export const TaskListColumns: StoryObj = story("task-list-columns");
