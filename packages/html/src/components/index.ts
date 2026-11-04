/*
 * Every component that has runtime behavior. CSS-only components have no definition — their
 * HTML + CSS is complete on its own.
 * Adding a component = one folder + one entry here (checked by components.test.ts).
 */
import type { ComponentDefinition } from "../runtime/types.js";
import { accordion } from "./accordion/accordion.js";
import { alert } from "./alert/alert.js";
import { drawer } from "./drawer/drawer.js";
import { pagination } from "./pagination/pagination.js";
import { sortable } from "./sortable/sortable.js";
import { table } from "./table/table.js";
import { tablePagination } from "./table-pagination/table-pagination.js";
import { toggleButton } from "./toggle-button/toggle-button.js";
import { toggleGroup } from "./toggle-group/toggle-group.js";

export const components: readonly ComponentDefinition[] = [
  accordion as ComponentDefinition,
  alert as ComponentDefinition,
  drawer as ComponentDefinition,
  pagination as ComponentDefinition,
  sortable as ComponentDefinition,
  table as ComponentDefinition,
  tablePagination as ComponentDefinition,
  toggleButton as ComponentDefinition,
  toggleGroup as ComponentDefinition,
];
