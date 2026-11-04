/*
 * Every component that has runtime behavior. CSS-only components have no definition — their
 * HTML + CSS is complete on its own.
 * Adding a component = one folder + one entry here (checked by components.test.ts).
 */
import type { ComponentDefinition } from "../runtime/types.js";
import { toggleButton } from "./toggle-button/toggle-button.js";
import { toggleGroup } from "./toggle-group/toggle-group.js";

export const components: readonly ComponentDefinition[] = [
  toggleButton as ComponentDefinition,
  toggleGroup as ComponentDefinition,
];
