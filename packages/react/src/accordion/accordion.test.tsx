import { render, screen } from "@testing-library/react";
import { StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import {
  Accordion,
  AccordionActions,
  AccordionDetails,
  type AccordionProps,
  AccordionSummary,
} from "./accordion.js";

function Item({ title = "Item", ...props }: AccordionProps & { title?: string }) {
  return (
    <Accordion {...props}>
      <AccordionSummary>{title}</AccordionSummary>
      <AccordionDetails>{`Body of ${title}`}</AccordionDetails>
      <AccordionActions>
        <button type="button">Agree</button>
      </AccordionActions>
    </Accordion>
  );
}

const details = (title = "Item") =>
  screen.getByText(title, { selector: "summary" }).parentElement as HTMLDetailsElement;
const summary = (title = "Item") => screen.getByText(title, { selector: "summary" });
const nextToggle = (element: HTMLElement) =>
  new Promise<void>((resolve) =>
    element.addEventListener("toggle", () => resolve(), { once: true }),
  );
const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

describe("Accordion anatomy", () => {
  it("renders a closed <details> with explicit defaults, parts and a decorative plus icon", () => {
    render(<Item />);
    const root = details();
    expect(root.localName).toBe("details");
    expect(root.open).toBe(false);
    expect(root.dataset).toMatchObject({ okAccordion: "", okVariant: "default", okRuntime: "off" });
    expect(root.querySelector(":scope > [data-ok-accordion-summary]")).toBe(summary());
    const icon = summary().querySelector("[data-ok-accordion-icon]");
    expect(icon?.getAttribute("aria-hidden")).toBe("true");
    expect(icon?.querySelector("svg[data-ok-accordion-plus]")).not.toBeNull();
    expect(
      root.querySelector(":scope > [data-ok-accordion-details] + [data-ok-accordion-actions]"),
    ).not.toBeNull();
  });

  it("variant, disableGutters, name and a custom / hidden expand icon", () => {
    render(
      <>
        <Accordion variant="soft" disableGutters name="g">
          <AccordionSummary expandIcon={<i data-testid="chevron" />}>A</AccordionSummary>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={null}>B</AccordionSummary>
        </Accordion>
      </>,
    );
    expect(details("A").dataset).toMatchObject({ okVariant: "soft", okDisableGutters: "" });
    expect(details("A").getAttribute("name")).toBe("g");
    expect(screen.getByTestId("chevron").parentElement?.dataset["okAccordionIcon"]).toBe("");
    expect(summary("B").querySelector("[data-ok-accordion-icon]")).toBeNull();
  });

  it("renders the same markup on the server", () => {
    const html = renderToString(<Item defaultExpanded />);
    const server = document.createElement("div");
    server.innerHTML = html;
    const { container } = render(<Item defaultExpanded />);
    expect(server.innerHTML).toBe(container.innerHTML);
  });

  it("forwards refs and throws for parts outside <Accordion>", () => {
    const ref = { current: null as HTMLDetailsElement | null };
    render(<Accordion ref={ref}>x</Accordion>);
    expect(ref.current?.localName).toBe("details");
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<AccordionSummary>x</AccordionSummary>)).toThrow(/inside <Accordion>/);
    vi.restoreAllMocks();
  });
});

function Group() {
  const [open, setOpen] = useState<string | false>("A");
  return ["A", "B"].map((title) => (
    <Item
      key={title}
      title={title}
      name="g"
      expanded={open === title}
      onChange={(next) => setOpen(next ? title : false)}
    />
  ));
}

describe("Accordion behavior", () => {
  it("summary click and keyboard toggle it; onChange reports; no axe violations", async () => {
    const onChange = vi.fn();
    render(<Item onChange={onChange} />);
    await userEvent.click(summary());
    expect(details().open).toBe(true);
    await expectNoAxeViolations();
    summary().focus();
    await userEvent.keyboard("{Enter}");
    expect(details().open).toBe(false);
    await userEvent.keyboard(" ");
    expect(details().open).toBe(true);
    expect(onChange.mock.calls).toEqual([[true], [false], [true]]);
  });

  it("controlled: the owner decides", async () => {
    const onChange = vi.fn();
    const { rerender } = render(<Item expanded={false} onChange={onChange} />);
    await userEvent.click(summary());
    expect(onChange).toHaveBeenCalledWith(true);
    expect(details().open).toBe(false);
    rerender(<Item expanded onChange={onChange} />);
    expect(details().open).toBe(true);
  });

  it("disabled: aria-disabled, out of the tab order and never toggles", async () => {
    const onChange = vi.fn();
    render(<Item disabled onChange={onChange} />);
    expect(details().dataset["okDisabled"]).toBe("");
    expect(summary().getAttribute("aria-disabled")).toBe("true");
    expect(summary().tabIndex).toBe(-1);
    summary().click();
    expect(details().open).toBe(false);
    // Opened by the browser (find-in-page): reverted.
    details().open = true;
    await nextToggle(details());
    await frame();
    expect(details().open).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("a summary onClick can cancel the toggle", async () => {
    render(
      <Accordion>
        <AccordionSummary onClick={(event) => event.preventDefault()}>Blocked</AccordionSummary>
      </Accordion>,
    );
    await userEvent.click(summary("Blocked"));
    expect(details("Blocked").open).toBe(false);
  });

  it("syncs when the browser opens it; a controlled refusal is reverted", async () => {
    const onChange = vi.fn();
    const { rerender } = render(<Item onChange={onChange} />);
    details().open = true;
    await nextToggle(details());
    expect(onChange).toHaveBeenCalledWith(true);
    rerender(<Item expanded={false} onChange={onChange} />);
    await frame();
    expect(details().open).toBe(false);
    details().open = true;
    await nextToggle(details());
    await frame();
    expect(details().open).toBe(false);
  });

  it("name: one open at a time (native or fallback), state follows", async () => {
    render(
      <StrictMode>
        <Group />
        <Item title="Free" defaultExpanded />
      </StrictMode>,
    );
    expect(details("A").open).toBe(true);
    await userEvent.click(summary("B"));
    await frame();
    expect(details("B").open).toBe(true);
    expect(details("A").open).toBe(false);
    expect(details("Free").open).toBe(true);
  });

  it("a nested accordion's toggle doesn't affect its parent", async () => {
    const onChange = vi.fn();
    render(
      <Accordion defaultExpanded onChange={onChange}>
        <AccordionSummary>Outer</AccordionSummary>
        <AccordionDetails>
          <Item title="Inner" />
        </AccordionDetails>
      </Accordion>,
    );
    await userEvent.click(summary("Inner"));
    await frame();
    expect(details("Inner").open).toBe(true);
    expect(details("Outer").open).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });
});
