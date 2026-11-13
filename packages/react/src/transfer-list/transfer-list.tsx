"use client";

import {
  altArrowLeftLinear,
  altArrowRightLinear,
  canTransfer,
  doubleAltArrowLeftLinear,
  doubleAltArrowRightLinear,
  type IconData,
  sideCheckedState,
  type TransferDirection,
  type TransferListVariant,
  toggleAll,
  transferCountLabel,
  transferListAttributes,
  transferMove,
} from "@owlky/core";
import { forwardRef, type HTMLAttributes, type ReactNode, useId, useState } from "react";
import { Button } from "../button/button.js";
import { Checkbox } from "../checkbox/checkbox.js";
import { List, ListItem } from "../list/list.js";
import { Scrollbar } from "../scrollbar/scrollbar.js";
import { Icon } from "../utils/icon.js";
import { useControllableState } from "../utils/use-controllable-state.js";

export interface TransferListItem {
  /** Identifies the item. */
  value: string;
  /** What the row shows. */
  label: ReactNode;
}

const ARROWS: Record<TransferDirection, IconData> = {
  "all-right": doubleAltArrowRightLinear,
  right: altArrowRightLinear,
  left: altArrowLeftLinear,
  "all-left": doubleAltArrowLeftLinear,
};

/** The arrow of a move button (decorative). */
function Arrow({ direction }: { direction: TransferDirection }) {
  return <Icon icon={ARROWS[direction]} />;
}

const DEFAULT_LABELS: Record<TransferDirection, string> = {
  "all-right": "Move all right",
  right: "Move selected right",
  left: "Move selected left",
  "all-left": "Move all left",
};

export interface TransferListProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Every item, on either side. */
  items: readonly TransferListItem[];
  /** Controlled: values on the left / right. */
  left?: readonly string[] | undefined;
  /** The items of the right list, controlled. */
  right?: readonly string[] | undefined;
  /** Uncontrolled: values on the left at first (the rest start on the right). Default: all. */
  defaultLeft?: readonly string[] | undefined;
  /** Called with both sides after a move. */
  onChange?: ((left: string[], right: string[]) => void) | undefined;
  /** `"simple"` (default): four buttons; `"enhanced"`: titles, select-all and counts. */
  variant?: TransferListVariant | undefined;
  /** Names of the two lists (and enhanced titles). Default `["Choices", "Chosen"]`. */
  titles?: readonly [string, string] | undefined;
  /** Text of the enhanced counts. Default "1/4 selected". */
  getCountLabel?: ((checked: number, total: number) => string) | undefined;
  /** Accessible names of the move buttons. */
  buttonLabels?: Partial<Record<TransferDirection, string>> | undefined;
  disabled?: boolean | undefined;
}

/**
 * TransferList — spec: specs/components/transfer-list.md. Two lists of checkable items and move
 * buttons (the MUI transfer list demo as a component). Built from Scrollbar, List, Checkbox and
 * Button; the move rules are core's `transferMove`.
 */
export const TransferList = forwardRef<HTMLDivElement, TransferListProps>(function TransferList(
  {
    items,
    left: leftProp,
    right: rightProp,
    defaultLeft,
    onChange,
    variant = "simple",
    titles = ["Choices", "Chosen"],
    getCountLabel = transferCountLabel,
    buttonLabels,
    disabled,
    ...props
  },
  ref,
) {
  const generated = useId();
  const id = props.id ?? generated;
  const all = items.map((item) => item.value);
  const initialLeft = defaultLeft ?? all;
  const [sides, setSides] = useControllableState<{ left: string[]; right: string[] }>({
    value:
      leftProp !== undefined && rightProp !== undefined
        ? { left: [...leftProp], right: [...rightProp] }
        : undefined,
    defaultValue: {
      left: [...initialLeft],
      right: all.filter((value) => !initialLeft.includes(value)),
    },
    onChange: (next) => onChange?.(next.left, next.right),
  });
  const [checked, setChecked] = useState<string[]>([]);
  const state = { left: sides.left, right: sides.right, checked };
  const byValue = new Map(items.map((item) => [item.value, item]));

  const move = (direction: TransferDirection) => {
    const next = transferMove(state, direction);
    setChecked(next.checked);
    setSides({ left: next.left, right: next.right });
  };
  const toggle = (value: string, on: boolean) =>
    setChecked(on ? [...checked, value] : checked.filter((v) => v !== value));

  const panel = (side: "left" | "right", title: string) => {
    const values = side === "left" ? sides.left : sides.right;
    const selectAll = sideCheckedState(checked, values);
    const count = values.filter((v) => checked.includes(v)).length;
    return (
      <section data-ok-transfer-list-panel="" data-ok-side={side}>
        {variant === "enhanced" && (
          <div data-ok-transfer-list-header="">
            <Checkbox
              aria-label={`Select all ${title.toLowerCase()}`}
              checked={selectAll === true}
              indeterminate={selectAll === "mixed"}
              disabled={disabled || values.length === 0}
              onChange={() => setChecked(toggleAll(checked, values))}
            />
            <span data-ok-transfer-list-title="">{title}</span>
            <span data-ok-transfer-list-count="">{getCountLabel(count, values.length)}</span>
          </div>
        )}
        <Scrollbar aria-label={title}>
          <List disablePadding>
            {values.map((value) => (
              <ListItem key={value} disablePadding data-ok-value={value}>
                {/* biome-ignore lint/a11y/noLabelWithoutControl: the Checkbox renders the input. */}
                <label data-ok-transfer-list-option="">
                  <Checkbox
                    id={`${id}-${value}`}
                    checked={checked.includes(value)}
                    disabled={disabled}
                    onChange={(on) => toggle(value, on)}
                  />
                  <span>{byValue.get(value)?.label ?? value}</span>
                </label>
              </ListItem>
            ))}
          </List>
        </Scrollbar>
      </section>
    );
  };

  const directions: TransferDirection[] =
    variant === "enhanced" ? ["right", "left"] : ["all-right", "right", "left", "all-left"];

  return (
    <div
      ref={ref}
      {...transferListAttributes({ variant, disabled })}
      data-ok-runtime="off"
      {...props}
    >
      {panel("left", titles[0])}
      <div data-ok-transfer-list-actions="">
        {directions.map((direction) => (
          <Button
            key={direction}
            variant="outlined"
            size="sm"
            data-ok-transfer-list-move={direction}
            aria-label={buttonLabels?.[direction] ?? DEFAULT_LABELS[direction]}
            disabled={disabled || !canTransfer(state, direction)}
            onClick={() => move(direction)}
          >
            <Arrow direction={direction} />
          </Button>
        ))}
      </div>
      {panel("right", titles[1])}
    </div>
  );
});
