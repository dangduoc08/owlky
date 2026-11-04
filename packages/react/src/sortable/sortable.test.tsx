import { render, screen } from "@testing-library/react";
import { createRef, type Ref, StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { arrayMove, Sortable, type SortableProps } from "./sortable.js";

type Demo = Partial<SortableProps<number>> & {
  count?: number;
  removable?: boolean;
  ref?: Ref<HTMLUListElement>;
};

function Numbers({ count = 4, removable = true, ...props }: Demo) {
  const [items, setItems] = useState(() => Array.from({ length: count }, (_, i) => i + 1));
  return (
    <Sortable
      aria-label="Numbers"
      items={items}
      getKey={(n) => n}
      getItemLabel={(n) => `item ${n}`}
      renderItem={(n) => <span>{n}</span>}
      onReorder={setItems}
      onRemove={removable ? (n) => setItems((all) => all.filter((x) => x !== n)) : undefined}
      {...props}
    />
  );
}

const order = () =>
  screen
    .getAllByRole("listitem")
    .map((li) => li.querySelector("span")?.textContent)
    .join(",");
const handle = (n: number) => screen.getByRole("button", { name: `Reorder item ${n}` });

describe("Sortable anatomy", () => {
  it("renders a named list with explicit defaults, handles and remove buttons", () => {
    const ref = createRef<HTMLUListElement>();
    render(<Numbers ref={ref} layout={"x" as never} />);
    const list = screen.getByRole("list", { name: "Numbers" });
    expect(ref.current).toBe(list);
    expect(list.dataset).toMatchObject({ mtSortable: "", mtLayout: "grid", mtRuntime: "off" });
    expect(handle(1).getAttribute("aria-pressed")).toBe("false");
    expect(handle(1).dataset).toMatchObject({ mtIconButton: "", mtColor: "default", mtSize: "sm" });
    expect(screen.getByRole("button", { name: "Remove item 1" })).toBeTruthy();
  });

  it("without onRemove there are no remove buttons; default labels use positions", () => {
    render(
      <Sortable
        aria-label="Plain"
        layout="vertical"
        items={["a", "b"]}
        getKey={(x) => x}
        renderItem={(x) => x}
        onReorder={() => {}}
      />,
    );
    expect(screen.queryByRole("button", { name: /Remove/ })).toBeNull();
    expect(screen.getByRole("button", { name: "Reorder Item 2" })).toBeTruthy();
  });

  it("renders the same markup on the server", () => {
    const html = renderToString(<Numbers layout="horizontal" />);
    const server = document.createElement("div");
    server.innerHTML = html;
    const { container } = render(<Numbers layout="horizontal" />);
    expect(server.innerHTML).toBe(container.innerHTML);
  });

  it("exports arrayMove", () => {
    expect(arrayMove(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
  });
});

describe("Sortable behavior", () => {
  it("reorders with the keyboard; focus stays on the moved handle", async () => {
    render(<Numbers layout="vertical" />);
    handle(1).focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{ArrowDown}");
    expect(order()).toBe("2,3,1,4");
    await vi.waitFor(() => expect(document.activeElement).toBe(handle(1)));
    expect(handle(1).getAttribute("aria-pressed")).toBe("true");
    await userEvent.keyboard(" ");
    expect(handle(1).getAttribute("aria-pressed")).toBe("false");
  });

  it("moves with two taps and removes items, keeping focus in the list", async () => {
    render(
      <StrictMode>
        <Numbers />
      </StrictMode>,
    );
    await userEvent.click(handle(4));
    await userEvent.click(handle(1));
    expect(order()).toBe("4,1,2,3");
    await userEvent.click(screen.getByRole("button", { name: "Remove item 1" }));
    expect(order()).toBe("4,2,3");
    await vi.waitFor(() => expect(document.activeElement).toBe(handle(2)));
  });

  it("controlled: nothing moves unless the owner applies onReorder", async () => {
    const onReorder = vi.fn();
    render(
      <Sortable
        aria-label="Fixed"
        items={[1, 2, 3]}
        getKey={(n) => n}
        renderItem={(n) => <span>{n}</span>}
        onReorder={onReorder}
        messages={{ grabbed: () => "Pris." }}
      />,
    );
    screen.getByRole("button", { name: "Reorder Item 1" }).focus();
    await userEvent.keyboard(" ");
    expect(document.querySelector("[data-mt-sortable-announcer]")?.textContent).toBe("Pris.");
    await userEvent.keyboard("{ArrowRight}");
    expect(onReorder).toHaveBeenCalledWith([2, 1, 3]);
    expect(order()).toBe("1,2,3");
  });

  it("styles the layouts and has no axe violations", async () => {
    render(
      <>
        <Numbers layout="vertical" />
        <Numbers layout="horizontal" removable={false} />
      </>,
    );
    const [vertical, horizontal] = screen.getAllByRole("list");
    expect(getComputedStyle(vertical as Element).flexDirection).toBe("column");
    expect(getComputedStyle(horizontal as Element).overflowX).toBe("auto");
    expect(
      getComputedStyle(screen.getAllByRole("listitem")[0] as Element).borderTopLeftRadius,
    ).toBe("12px");
    await expectNoAxeViolations();
  });
});
