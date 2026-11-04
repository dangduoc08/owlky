/*
 * Every component that has runtime behavior. CSS-only components (button, switch) have no
 * definition — their HTML + CSS is complete on its own.
 * Adding a component = one folder + one line here (checked by components.test.ts).
 */
import { dialog } from "./dialog/dialog.js";

export { type DialogCloseReason, type DialogInstance, dialog } from "./dialog/dialog.js";

export const components = [dialog] as const;
