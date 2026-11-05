import { GLOBALS_UPDATED, SET_GLOBALS } from "storybook/internal/core-events";
import { addons } from "storybook/preview-api";
import { DEFAULT_FRAMEWORK, type Framework, toFramework } from "./groups.js";

/*
 * The toolbar's Framework choice (global `framework`, ADR-0018) for docs pages, which don't get
 * globals as stories do. Registered by preview.tsx before any page renders.
 */

let current: Framework = DEFAULT_FRAMEWORK;
const listeners = new Set<() => void>();

const update = ({ globals }: { globals?: Record<string, unknown> }) => {
  const next = toFramework(globals?.["framework"]);
  if (next === current) return;
  current = next;
  for (const listener of listeners) listener();
};

export function trackFrameworkGlobal() {
  const channel = addons.getChannel();
  channel.on(SET_GLOBALS, update);
  channel.on(GLOBALS_UPDATED, update);
}

export const frameworkGlobal = {
  get: () => current,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
