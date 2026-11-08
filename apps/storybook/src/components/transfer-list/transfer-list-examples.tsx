import { transferListOptions } from "@owlky/core";
import { TransferList } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import type { GroupFiles } from "../shared/snippets.js";

const ITEMS = ["Apples", "Bananas", "Cherries", "Dates", "Figs", "Grapes", "Kiwis", "Lemons"].map(
  (label, i) => ({ value: `fruit-${i + 1}`, label }),
);
const HALF = ITEMS.slice(0, 4).map((item) => item.value);

/** Story groups — the same examples as `packages/html/src/components/transfer-list/examples/`. */
export const transferListStories: Record<string, ReactGroup[]> = {
  simple: [
    {
      title: "Simple",
      content: <TransferList id="transfer-simple" items={ITEMS} defaultLeft={HALF} />,
    },
  ],
  enhanced: [
    {
      title: "Enhanced",
      content: (
        <TransferList id="transfer-enhanced" items={ITEMS} defaultLeft={HALF} variant="enhanced" />
      ),
    },
  ],
};

export const TRANSFER_LIST_FILES: Record<string, GroupFiles> = {
  simple: [["Simple", "group"]],
  enhanced: [["Enhanced", "group"]],
};

/** Story Controls shared by the React and HTML stories (ADR-0015). */
export const TRANSFER_LIST_CONTROLS = { schema: transferListOptions, keys: ["disabled"] } as const;
