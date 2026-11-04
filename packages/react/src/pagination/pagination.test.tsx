import { render, screen } from "@testing-library/react";
import { StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { Pagination, PaginationItem } from "./pagination.js";

const pages = () =>
  screen
    .getAllByRole("button")
    .filter((b) => b.dataset["okType"] === "page")
    .map((b) => `${b.textContent}${b.getAttribute("aria-current") ? "*" : ""}`);

describe("Pagination anatomy", () => {
  it("renders a named nav with explicit defaults, items and an ellipsis", () => {
    render(<Pagination count={10} />);
    const nav = screen.getByRole("navigation", { name: "pagination navigation" });
    expect(nav.dataset).toMatchObject({
      okPagination: "",
      okVariant: "text",
      okColor: "standard",
      okShape: "circular",
      okSize: "md",
      okRuntime: "off",
    });
    expect(pages()).toEqual(["1*", "2", "3", "4", "5", "10"]);
    const current = screen.getByRole("button", { name: "page 1" });
    expect(current.getAttribute("aria-current")).toBe("page");
    expect((current as HTMLButtonElement).value).toBe("1");
    expect(screen.getByRole("button", { name: "Go to page 2" })).not.toBeNull();
    const previous = screen.getByRole("button", {
      name: "Go to previous page",
    }) as HTMLButtonElement;
    expect(previous.disabled).toBe(true);
    expect(previous.querySelector("svg[aria-hidden='true']")).not.toBeNull();
    const ellipsis = nav.querySelector("[data-ok-pagination-ellipsis]");
    expect(ellipsis?.getAttribute("aria-hidden")).toBe("true");
    expect(ellipsis?.textContent).toBe("…");
  });

  it("style options, disabled, first / last, hidden previous / next", () => {
    const { rerender } = render(
      <Pagination
        count={5}
        variant="soft"
        color="info"
        shape="rounded"
        size="lg"
        disabled
        showFirstButton
        showLastButton
      />,
    );
    const nav = screen.getByRole("navigation");
    expect(nav.dataset).toMatchObject({
      okVariant: "soft",
      okColor: "info",
      okShape: "rounded",
      okSize: "lg",
      okDisabled: "",
    });
    expect(screen.getAllByRole("button").every((b) => (b as HTMLButtonElement).disabled)).toBe(
      true,
    );
    expect(screen.getByRole("button", { name: "Go to first page" })).not.toBeNull();
    rerender(<Pagination count={5} hidePrevButton hideNextButton aria-label="Results" />);
    expect(screen.getByRole("navigation", { name: "Results" })).not.toBeNull();
    expect(screen.queryByRole("button", { name: /previous|next/ })).toBeNull();
  });

  it("custom icons, labels and renderItem (links)", () => {
    render(
      <Pagination
        count={3}
        defaultPage={2}
        icons={{ previous: <i data-testid="prev" />, next: <i data-testid="next" /> }}
        getItemAriaLabel={(type, page, selected) => `${type}:${page}:${selected}`}
        renderItem={(item) => <PaginationItem {...item} href={`/page/${item.page}`} />}
      />,
    );
    expect(screen.getByTestId("prev").closest("a")?.getAttribute("href")).toBe("/page/1");
    expect(screen.getByTestId("next")).not.toBeNull();
    const current = screen.getByRole("link", { name: "page:2:true" });
    expect(current.getAttribute("aria-current")).toBe("page");
    expect(current.dataset).toMatchObject({ okPaginationItem: "", okType: "page" });
  });

  it("disabled links have no href; renders the same markup on the server", () => {
    render(<PaginationItem type="next" href="/x" disabled aria-label="Next" />);
    const link = screen.getByText((_, el) => el?.getAttribute("aria-label") === "Next");
    expect(link.hasAttribute("href")).toBe(false);
    expect(link.getAttribute("aria-disabled")).toBe("true");
    const html = renderToString(<Pagination count={11} defaultPage={6} />);
    const server = document.createElement("div");
    server.innerHTML = html;
    const { container } = render(<Pagination count={11} defaultPage={6} />);
    expect(server.innerHTML).toBe(container.innerHTML);
  });
});

function Controlled({ onChange }: { onChange: (page: number) => void }) {
  const [page, setPage] = useState(1);
  return (
    <Pagination
      count={10}
      page={page}
      onChange={(next) => {
        onChange(next);
        if (next !== 3) setPage(next);
      }}
    />
  );
}

describe("Pagination behavior", () => {
  it("uncontrolled: page items, previous / next, ellipsis ranges; no axe violations", async () => {
    const onChange = vi.fn();
    render(
      <StrictMode>
        <Pagination count={10} onChange={onChange} />
      </StrictMode>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Go to page 5" }));
    expect(pages()).toEqual(["1", "4", "5*", "6", "10"]);
    await userEvent.click(screen.getByRole("button", { name: "Go to next page" }));
    await userEvent.click(screen.getByRole("button", { name: "Go to previous page" }));
    screen.getByRole("button", { name: "Go to page 6" }).focus();
    await userEvent.keyboard("{Enter}");
    expect(onChange.mock.calls).toEqual([[5], [6], [5], [6]]);
    await expectNoAxeViolations();
  });

  it("controlled: the owner can refuse a page", async () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Go to page 3" }));
    expect(onChange).toHaveBeenCalledWith(3);
    expect(pages()[0]).toBe("1*");
    await userEvent.click(screen.getByRole("button", { name: "Go to page 2" }));
    expect(pages()[1]).toBe("2*");
  });

  it("every variant and color has no axe violations", async () => {
    const { container } = render(
      <div>
        {(["text", "outlined", "soft"] as const).flatMap((variant) =>
          (["standard", "primary", "warning"] as const).map((color) => (
            <Pagination
              key={variant + color}
              count={3}
              variant={variant}
              color={color}
              aria-label={`${variant} ${color}`}
            />
          )),
        )}
      </div>,
    );
    expect(container.querySelectorAll("nav")).toHaveLength(9);
    await expectNoAxeViolations();
  });
});
