import { canTransfer, sideCheckedState, type TransferDirection, transferMove } from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance } from "../../runtime/types.js";

export interface TransferListInstance extends ComponentInstance {
  /** Item values on each side, in order. */
  readonly value: { left: string[]; right: string[] };
  /** Moves items as a move button would. Returns `false` if nothing moved or it was prevented. */
  move(direction: TransferDirection): boolean;
}

const COUNT = "{checked}/{total} selected";

/**
 * Transfer list — spec: specs/components/transfer-list.md
 *
 * Markup:  <div data-ok-transfer-list data-ok-variant="simple">
 *            <section data-ok-transfer-list-panel data-ok-side="left">
 *              <section data-ok-scrollbar aria-label="Choices" tabindex="0"><ul data-ok-list>
 *                <li data-ok-list-item data-ok-value="a"><label data-ok-transfer-list-option>
 *                  <span data-ok-checkbox …><input type="checkbox">…</span><span>Item A</span></label></li> …
 *            </section>
 *            <div data-ok-transfer-list-actions>
 *              <button data-ok-button data-ok-transfer-list-move="right" aria-label="Move selected right">…</button> …
 *            </div>
 *            <section data-ok-transfer-list-panel data-ok-side="right">…</section>
 *          </div>
 * Behavior: move buttons move the checked rows (or all) to the other list and uncheck them;
 *          buttons are disabled when they would move nothing; enhanced headers keep their
 *          select-all checkbox (mixed state) and count (`data-ok-label-count`) in step.
 * Events:  ok:transfer-list:change (cancelable, detail `{ left, right, direction }`).
 */
export const transferList = defineComponent<TransferListInstance>({
  name: "transfer-list",
  selector: "[data-ok-transfer-list]",

  setup(element, { emit, signal }) {
    const panel = (side: "left" | "right") =>
      element.querySelector<HTMLElement>(`[data-ok-transfer-list-panel][data-ok-side="${side}"]`);
    const list = (side: "left" | "right") =>
      panel(side)?.querySelector<HTMLElement>("[data-ok-list]");
    const rows = (side: "left" | "right") =>
      [...(list(side)?.children ?? [])].filter((row): row is HTMLElement =>
        row.hasAttribute("data-ok-value"),
      );
    const rowValue = (row: Element) => row.getAttribute("data-ok-value") as string;
    const box = (row: Element) => row.querySelector<HTMLInputElement>('input[type="checkbox"]');
    const state = () => ({
      left: rows("left").map(rowValue),
      right: rows("right").map(rowValue),
      checked: [...rows("left"), ...rows("right")].filter((row) => box(row)?.checked).map(rowValue),
    });

    const sync = () => {
      const current = state();
      const off = element.hasAttribute("data-ok-disabled");
      for (const input of element.querySelectorAll<HTMLInputElement>("[data-ok-list] input"))
        input.disabled = off;
      for (const button of element.querySelectorAll<HTMLButtonElement>(
        "[data-ok-transfer-list-move]",
      )) {
        const direction = button.getAttribute("data-ok-transfer-list-move") as TransferDirection;
        button.disabled =
          element.hasAttribute("data-ok-disabled") || !canTransfer(current, direction);
      }
      for (const side of ["left", "right"] as const) {
        const header = panel(side)?.querySelector("[data-ok-transfer-list-header]");
        if (!header) continue;
        const values = side === "left" ? current.left : current.right;
        const all = sideCheckedState(current.checked, values);
        const toggle = header.querySelector<HTMLInputElement>('input[type="checkbox"]');
        if (toggle) {
          toggle.checked = all === true;
          toggle.indeterminate = all === "mixed";
          toggle.disabled = off || values.length === 0;
          toggle
            .closest("[data-ok-checkbox]")
            ?.toggleAttribute("data-ok-indeterminate", all === "mixed");
        }
        const count = header.querySelector("[data-ok-transfer-list-count]");
        if (count)
          count.textContent = (element.getAttribute("data-ok-label-count") || COUNT)
            .replace("{checked}", String(values.filter((v) => current.checked.includes(v)).length))
            .replace("{total}", String(values.length));
      }
    };

    const instance: TransferListInstance = {
      get value() {
        const { left, right } = state();
        return { left, right };
      },
      move(direction) {
        const current = state();
        if (!canTransfer(current, direction)) return false;
        const next = transferMove(current, direction);
        if (
          !emit("change", { left: next.left, right: next.right, direction }, { cancelable: true })
        )
          return false;
        const all = new Map([...rows("left"), ...rows("right")].map((row) => [rowValue(row), row]));
        for (const [side, values] of [
          ["left", next.left],
          ["right", next.right],
        ] as const) {
          const target = list(side);
          for (const value of values) {
            const row = all.get(value) as HTMLElement;
            if (row.parentElement !== target) {
              const input = box(row);
              if (input) input.checked = false;
              target?.append(row);
            }
          }
        }
        sync();
        return true;
      },
    };

    element.addEventListener(
      "click",
      (event) => {
        const button = (event.target as Element).closest?.("[data-ok-transfer-list-move]");
        if (button && element.contains(button))
          instance.move(button.getAttribute("data-ok-transfer-list-move") as TransferDirection);
      },
      { signal },
    );
    element.addEventListener(
      "change",
      (event) => {
        const input = event.target as HTMLInputElement;
        const header = input.closest("[data-ok-transfer-list-header]");
        if (header) {
          const side = header
            .closest("[data-ok-transfer-list-panel]")
            ?.getAttribute("data-ok-side");
          for (const row of rows(side === "right" ? "right" : "left")) {
            const checkbox = box(row);
            if (checkbox) checkbox.checked = input.checked;
          }
        }
        sync();
      },
      { signal },
    );
    sync();
    return instance;
  },
});
