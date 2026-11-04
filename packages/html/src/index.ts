/*
 * @minimal-tailwind/html — side-effect free entry. Nothing runs on import.
 *
 *   import { components, getRuntime } from "@minimal-tailwind/html";
 *   getRuntime().register(...components).start();
 *
 * Or import "@minimal-tailwind/html/auto" to register every component and start.
 */

export type {
  DrawerCloseReason,
  DrawerInstance,
} from "./components/drawer/drawer.js";
export { components } from "./components/index.js";
export type { SortableInstance } from "./components/sortable/sortable.js";
export type { ToggleButtonInstance } from "./components/toggle-button/toggle-button.js";
export type { ToggleGroupInstance } from "./components/toggle-group/toggle-group.js";
export { defineComponent, readBooleanOption } from "./runtime/define.js";
export { getRuntime } from "./runtime/global.js";
export { createRuntime, RUNTIME_OFF_SELECTOR } from "./runtime/runtime.js";
export type {
  ComponentDefinition,
  ComponentInstance,
  DelegatedHandler,
  EmitOptions,
  Runtime,
  SetupContext,
  StartOptions,
} from "./runtime/types.js";
export { PROTOCOL, VERSION } from "./runtime/version.js";
