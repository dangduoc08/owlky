/*
 * Every component that has runtime behavior. CSS-only components have no definition — their
 * HTML + CSS is complete on its own.
 * Adding a component = one folder + one entry here (checked by components.test.ts).
 */
import type { ComponentDefinition } from "../runtime/types.js";
import { accordion } from "./accordion/accordion.js";
import { alert } from "./alert/alert.js";
import { avatar } from "./avatar/avatar.js";
import { checkbox } from "./checkbox/checkbox.js";
import { chip } from "./chip/chip.js";
import { circularProgress } from "./circular-progress/circular-progress.js";
import { dialog } from "./dialog/dialog.js";
import { drawer } from "./drawer/drawer.js";
import { linearProgress } from "./linear-progress/linear-progress.js";
import { list } from "./list/list.js";
import { menu } from "./menu/menu.js";
import { pagination } from "./pagination/pagination.js";
import { popover } from "./popover/popover.js";
import { sortable } from "./sortable/sortable.js";
import { table } from "./table/table.js";
import { tablePagination } from "./table-pagination/table-pagination.js";
import { textField } from "./text-field/text-field.js";
import { toaster } from "./toaster/toaster.js";
import { toggleButton } from "./toggle-button/toggle-button.js";
import { toggleGroup } from "./toggle-group/toggle-group.js";
import { tooltip } from "./tooltip/tooltip.js";

export const components: readonly ComponentDefinition[] = [
  tooltip as ComponentDefinition,
  toaster as ComponentDefinition,
  popover as ComponentDefinition,
  menu as ComponentDefinition,
  dialog as ComponentDefinition,
  accordion as ComponentDefinition,
  alert as ComponentDefinition,
  avatar as ComponentDefinition,
  checkbox as ComponentDefinition,
  chip as ComponentDefinition,
  circularProgress as ComponentDefinition,
  drawer as ComponentDefinition,
  linearProgress as ComponentDefinition,
  list as ComponentDefinition,
  pagination as ComponentDefinition,
  sortable as ComponentDefinition,
  table as ComponentDefinition,
  tablePagination as ComponentDefinition,
  textField as ComponentDefinition,
  toggleButton as ComponentDefinition,
  toggleGroup as ComponentDefinition,
];
