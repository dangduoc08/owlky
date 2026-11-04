import { alertSeverities, alertVariants } from "@owlky/core";
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { Alert, AlertTitle } from "./alert.js";

describe("Alert", () => {
  it("renders role=alert with explicit defaults, an icon and the message", () => {
    render(<Alert>Saved</Alert>);
    const alert = screen.getByRole("alert");
    expect(alert.dataset).toMatchObject({
      okAlert: "",
      okSeverity: "success",
      okVariant: "standard",
      okColor: "success",
    });
    expect(alert.querySelector(":scope > [data-ok-alert-icon] > svg[aria-hidden]")).not.toBeNull();
    expect(alert.querySelector("[data-ok-alert-message]")?.textContent).toBe("Saved");
    expect(alert.querySelector("[data-ok-alert-action]")).toBeNull();
  });

  it("color defaults to the severity; role, icon, iconMapping and title", () => {
    render(
      <>
        <Alert severity="error" color="info" role="status" icon={false}>
          <AlertTitle>Title</AlertTitle>A
        </Alert>
        <Alert severity="warning" iconMapping={{ warning: <i data-testid="mapped" /> }}>
          B
        </Alert>
        <Alert severity="info" icon={<i data-testid="custom" />}>
          C
        </Alert>
      </>,
    );
    const status = screen.getByRole("status");
    expect(status.dataset).toMatchObject({ okSeverity: "error", okColor: "info" });
    expect(status.querySelector("[data-ok-alert-icon]")).toBeNull();
    expect(screen.getByText("Title").dataset["okAlertTitle"]).toBe("");
    expect(screen.getByTestId("mapped").parentElement?.dataset["okAlertIcon"]).toBe("");
    expect(screen.getByTestId("custom")).not.toBeNull();
    expect(screen.getAllByRole("alert")[1]?.dataset["okColor"]).toBe("info");
  });

  it("onClose renders a named close button; action replaces it", async () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Alert onClose={onClose} closeText="Dismiss">
        Saved
      </Alert>,
    );
    const close = screen.getByRole("button", { name: "Dismiss" });
    expect(close.dataset).toMatchObject({ okIconButton: "", okSize: "sm", okAlertClose: "" });
    await userEvent.click(close);
    expect(onClose).toHaveBeenCalledOnce();
    rerender(
      <Alert onClose={onClose} action={<button type="button">Undo</button>}>
        Saved
      </Alert>,
    );
    expect(screen.queryByRole("button", { name: "Dismiss" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Undo" }).parentElement?.dataset["okAlertAction"],
    ).toBe("");
  });

  it("renders the same markup on the server and forwards refs", () => {
    const html = renderToString(<Alert onClose={() => {}}>x</Alert>);
    const server = document.createElement("div");
    server.innerHTML = html;
    const ref = { current: null as HTMLDivElement | null };
    const { container } = render(
      <Alert ref={ref} onClose={() => {}}>
        x
      </Alert>,
    );
    expect(server.innerHTML).toBe(container.innerHTML);
    expect(ref.current?.dataset["okAlert"]).toBe("");
  });

  it("every severity × variant has no axe violations; standard text meets AA", async () => {
    render(
      <div>
        {alertVariants.flatMap((variant) =>
          alertSeverities.map((severity) => (
            <Alert
              key={variant + severity}
              severity={severity}
              variant={variant}
              onClose={() => {}}
            >
              <AlertTitle>{severity}</AlertTitle>
              Message
            </Alert>
          )),
        )}
      </div>,
    );
    await expectNoAxeViolations();
  });
});
