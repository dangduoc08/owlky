/*
 * @owlky/html — side-effect free entry. Nothing runs on import.
 *
 *   import { components, getRuntime } from "@owlky/html";
 *   getRuntime().register(...components).start();
 *
 * Or import "@owlky/html/auto" to register every component and start.
 */

// Motion gestures (ADR-0062, 5.3).
export type {
  DragConstraints,
  DragElastic,
  DragTransition,
  GestureTarget,
  PanAxis,
  PanInfo,
  TapInfo,
} from "@owlky/core";
export {
  type AnimateOptions,
  type AnimationControls,
  animate,
  applyThemeSettings,
  defaultThemeSettings,
  type MotionEasing,
  type MotionKeyframes,
  normalizeThemeSettings,
  observeScroll,
  readThemeSettings,
  resetThemeSettings,
  type ScrollInfo,
  type ScrollOptions,
  type SpringOptions,
  springEasing,
  THEME_SETTINGS_KEY,
  type ThemeSettings,
  type ThemeSettingsOptions,
} from "@owlky/core";
export type { AccordionInstance } from "./components/accordion/accordion.js";
export type { AlertInstance } from "./components/alert/alert.js";
export type { ChartInstance } from "./components/chart/chart.js";
export {
  type CodeEditorElementInstance,
  type CreateCodeEditorOptions,
  codeEditor,
  createCodeEditor,
} from "./components/code-editor/code-editor.js";
export {
  type CreateDiffEditorOptions,
  createDiffEditor,
  type DiffEditorElementInstance,
  diffEditor,
} from "./components/diff-editor/diff-editor.js";
export type {
  DrawerCloseReason,
  DrawerInstance,
} from "./components/drawer/drawer.js";
export {
  type CreateEditorOptions,
  createEditor,
  type EditorInstance,
  editor,
} from "./components/editor/editor.js";
export {
  createIllustration,
  type IllustrationInstance,
  illustration,
} from "./components/illustration/illustration.js";
export { components } from "./components/index.js";
export { type MapInstance, map } from "./components/map/map.js";
export {
  type CreateMarkdownOptions,
  createMarkdown,
  type MarkdownInstance,
  markdown,
} from "./components/markdown/markdown.js";
export type { PaginationInstance } from "./components/pagination/pagination.js";
export {
  type CreatePhoneInputOptions,
  createPhoneInput,
  type PhoneInputEvents,
  type PhoneInputInstance,
  phoneInput,
} from "./components/phone-input/phone-input.js";
export type { ScrollProgressInstance } from "./components/scroll-progress/scroll-progress.js";
export type { SortableInstance } from "./components/sortable/sortable.js";
export type { TableInstance } from "./components/table/table.js";
export type { TablePaginationInstance } from "./components/table-pagination/table-pagination.js";
export type { ToggleButtonInstance } from "./components/toggle-button/toggle-button.js";
export type { ToggleGroupInstance } from "./components/toggle-group/toggle-group.js";
export { defineComponent, readBooleanOption } from "./runtime/define.js";
export { getRuntime } from "./runtime/global.js";
export { createRuntime, RUNTIME_OFF_SELECTOR } from "./runtime/runtime.js";
export type {
  AnyEvents,
  ComponentDefinition,
  ComponentInstance,
  DelegatedHandler,
  EmitOptions,
  EventMap,
  EventSpec,
  Runtime,
  SetupContext,
  StartOptions,
} from "./runtime/types.js";
export { PROTOCOL, VERSION } from "./runtime/version.js";
