import { render, screen } from "@testing-library/react";
import { createRef, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { Checkbox } from "../checkbox/checkbox.js";
import { FormControlLabel } from "../form-control-label/form-control-label.js";
import { Radio, RadioGroup } from "../radio/radio.js";
import { Switch } from "../switch/switch.js";
import { expectNoAxeViolations } from "../test-utils.js";
import {
  FormControl,
  type FormControlState,
  FormGroup,
  FormHelperText,
  FormLabel,
  useFormControl,
} from "./form-control.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;
const css = (element: Element) => getComputedStyle(element);

/** The computed color of a `var(--ok-*)` value in `scope` (resolved like the element's). */
function color(value: string, scope: Element = document.body) {
  const probe = document.createElement("span");
  probe.style.color = value;
  scope.append(probe);
  const result = css(probe).color;
  probe.remove();
  return result;
}

function Probe({ onState }: { onState: (state: FormControlState | undefined) => void }) {
  onState(useFormControl());
  return null;
}

describe("FormControl", () => {
  it("renders a div root with only the marker by default, an inline column without margin", () => {
    render(<FormControl data-testid="fc">Content</FormControl>);
    const root = screen.getByTestId("fc");
    expect(root.localName).toBe("div");
    expect({ ...root.dataset }).toEqual({ testid: "fc", okFormControl: "" });
    const style = css(root);
    expect(style.display).toBe("inline-flex");
    expect(style.flexDirection).toBe("column");
    expect(style.minWidth).toBe("0px");
    expect(style.margin).toBe("0px");
    expect(style.verticalAlign).toBe("top");
  });

  it("a fieldset root loses its border and padding; disabled is native there", () => {
    render(
      <FormControl component="fieldset" disabled data-testid="fc">
        <FormLabel component="legend">Group</FormLabel>
        <FormGroup>
          <FormControlLabel label="One" control={<Checkbox />} />
        </FormGroup>
      </FormControl>,
    );
    const root = screen.getByTestId("fc") as HTMLFieldSetElement;
    expect(root.localName).toBe("fieldset");
    expect(root.disabled).toBe(true);
    expect(root.dataset["okDisabled"]).toBe("");
    expect(css(root).borderTopWidth).toBe("0px");
    expect(css(root).paddingTop).toBe("0px");
    expect(screen.getByRole("checkbox", { name: "One" }).matches(":disabled")).toBe(true);
    expect(screen.getByRole("group", { name: "Group" })).toBe(root);
  });

  it("disabled on a div root only colors the parts (no native attribute)", () => {
    render(<FormControl disabled data-testid="fc" />);
    expect(screen.getByTestId("fc").hasAttribute("disabled")).toBe(false);
  });

  it("writes every option; invalid values are dropped; ref and props reach the root", () => {
    const ref = createRef<HTMLElement>();
    render(
      <FormControl
        ref={ref}
        color="success"
        size="small"
        variant="filled"
        margin="dense"
        fullWidth
        error
        required
        focused
        className="mine"
        data-testid="fc"
      />,
    );
    const root = screen.getByTestId("fc");
    expect(ref.current).toBe(root);
    expect(root.className).toBe("mine");
    expect({ ...root.dataset }).toMatchObject({
      okColor: "success",
      okSize: "small",
      okVariant: "filled",
      okMargin: "dense",
      okFullWidth: "",
      okError: "",
      okRequired: "",
      okFocused: "",
    });
    render(<FormControl color={HOSTILE} margin={HOSTILE} data-testid="bad" />);
    expect({ ...screen.getByTestId("bad").dataset }).toEqual({ testid: "bad", okFormControl: "" });
  });

  it("margin and fullWidth", () => {
    render(
      <div style={{ width: "400px" }}>
        <FormControl margin="dense" data-testid="dense" />
        <FormControl margin="normal" fullWidth data-testid="normal" />
      </div>,
    );
    const dense = css(screen.getByTestId("dense"));
    expect([dense.marginTop, dense.marginBottom]).toEqual(["8px", "4px"]);
    const normal = screen.getByTestId("normal");
    expect([css(normal).marginTop, css(normal).marginBottom]).toEqual(["16px", "8px"]);
    expect(normal.getBoundingClientRect().width).toBe(400);
  });

  it("a standalone control keeps its width in the column", () => {
    render(
      <FormControl fullWidth data-testid="fc">
        <FormLabel htmlFor="s">Label</FormLabel>
        <Switch id="s" />
      </FormControl>,
    );
    const root = screen.getByTestId("fc");
    const control = root.querySelector("[data-ok-switch]") as HTMLElement;
    expect(control.getBoundingClientRect().width).toBeLessThan(root.getBoundingClientRect().width);
    expect(css(control).alignSelf).toBe("flex-start");
  });
});

describe("useFormControl", () => {
  it("is undefined outside a FormControl and the resolved state inside", () => {
    const seen: (FormControlState | undefined)[] = [];
    render(
      <>
        <Probe onState={(state) => seen.push(state)} />
        <FormControl error required color={HOSTILE}>
          <Probe onState={(state) => seen.push(state)} />
        </FormControl>
        <FormControl color="info" size="small" variant="standard" margin="normal" fullWidth>
          <Probe onState={(state) => seen.push(state)} />
        </FormControl>
      </>,
    );
    expect(seen[0]).toBeUndefined();
    expect(seen[1]).toEqual({
      color: "default",
      size: "medium",
      variant: "outlined",
      margin: "none",
      fullWidth: false,
      hiddenLabel: false,
      disabled: false,
      error: true,
      required: true,
      focused: false,
    });
    expect(seen[2]).toMatchObject({
      color: "info",
      size: "small",
      variant: "standard",
      margin: "normal",
      fullWidth: true,
    });
  });
});

describe("FormLabel", () => {
  it("a label (htmlFor) in body2 and the secondary text color, naming its input", async () => {
    render(
      <FormControl>
        <FormLabel htmlFor="mentions" data-testid="label">
          Email notifications
        </FormLabel>
        <Switch id="mentions" />
      </FormControl>,
    );
    const label = screen.getByTestId("label");
    expect(label.localName).toBe("label");
    expect({ ...label.dataset }).toEqual({ testid: "label", okFormLabel: "" });
    expect(css(label).color).toBe(color("var(--ok-text-secondary)"));
    expect(css(label).fontSize).toBe("14px");
    const input = screen.getByRole("switch", { name: "Email notifications" });
    await userEvent.click(label);
    expect((input as HTMLInputElement).checked).toBe(true);
  });

  it("the FormControl's states color it: focused < error < disabled", () => {
    const { rerender } = render(
      <FormControl focused data-testid="fc">
        <FormLabel component="span">Label</FormLabel>
      </FormControl>,
    );
    const label = screen.getByText("Label");
    expect(css(label).color).toBe(color("var(--ok-text-primary)"));
    rerender(
      <FormControl focused color="secondary" data-testid="fc">
        <FormLabel component="span">Label</FormLabel>
      </FormControl>,
    );
    expect(css(label).color).toBe(color("var(--ok-palette-secondary-text)"));
    rerender(
      <FormControl focused error data-testid="fc">
        <FormLabel component="span">Label</FormLabel>
      </FormControl>,
    );
    expect(css(label).color).toBe(color("var(--ok-palette-error-text)"));
    rerender(
      <FormControl focused error disabled data-testid="fc">
        <FormLabel component="span">Label</FormLabel>
      </FormControl>,
    );
    expect(css(label).color).toBe(color("var(--ok-text-disabled)"));
  });

  it("a fieldset root's native :disabled dims the legend", () => {
    render(
      <fieldset data-ok-form-control="" disabled>
        <legend data-ok-form-label="">Legend</legend>
      </fieldset>,
    );
    expect(css(screen.getByText("Legend")).color).toBe(color("var(--ok-text-disabled)"));
  });

  it("its own props add a state and a focus color to it only", () => {
    render(
      <FormControl>
        <FormLabel component="span" focused>
          Default
        </FormLabel>
        <FormLabel component="span" focused color="info">
          Info
        </FormLabel>
        <FormLabel component="span" color="default" focused>
          Text
        </FormLabel>
        <FormLabel component="span" error>
          Error
        </FormLabel>
        <FormLabel component="span" disabled filled>
          Off
        </FormLabel>
        <FormLabel component="span">Plain</FormLabel>
      </FormControl>,
    );
    expect(css(screen.getByText("Default")).color).toBe(color("var(--ok-text-primary)"));
    expect(css(screen.getByText("Info")).color).toBe(color("var(--ok-palette-info-text)"));
    expect(css(screen.getByText("Text")).color).toBe(color("var(--ok-text-primary)"));
    expect(css(screen.getByText("Error")).color).toBe(color("var(--ok-palette-error-text)"));
    const off = screen.getByText("Off");
    expect(css(off).color).toBe(color("var(--ok-text-disabled)"));
    expect(off.dataset["okFilled"]).toBe("");
    expect(css(screen.getByText("Plain")).color).toBe(color("var(--ok-text-secondary)"));
  });

  it("shows an aria-hidden asterisk when it or its FormControl is required; false hides it", () => {
    render(
      <>
        <FormLabel component="span" required>
          Own
        </FormLabel>
        <FormControl required>
          <FormLabel component="span">Shared</FormLabel>
          <FormLabel component="span" required={false}>
            Hidden
          </FormLabel>
        </FormControl>
        <FormLabel component="span">None</FormLabel>
      </>,
    );
    const own = screen.getByText("Own");
    expect(own.dataset["okRequired"]).toBe("");
    const asterisk = own.querySelector("[data-ok-form-label-asterisk]") as HTMLElement;
    expect(asterisk.textContent).toBe("*");
    expect(asterisk.getAttribute("aria-hidden")).toBe("true");
    expect(css(asterisk).marginInlineStart).not.toBe("0px");
    const shared = screen.getByText("Shared");
    expect(shared.hasAttribute("data-ok-required")).toBe(false);
    expect(shared.querySelector("[data-ok-form-label-asterisk]")).not.toBeNull();
    expect(screen.getByText("Hidden").querySelector("[data-ok-form-label-asterisk]")).toBeNull();
    expect(screen.getByText("None").querySelector("[data-ok-form-label-asterisk]")).toBeNull();
  });

  it("ref, props and an invalid color", () => {
    const ref = createRef<HTMLElement>();
    render(
      <FormLabel ref={ref} component="legend" color={HOSTILE} id="l" className="mine">
        Legend
      </FormLabel>,
    );
    expect(ref.current?.localName).toBe("legend");
    expect(ref.current?.id).toBe("l");
    expect(ref.current?.className).toBe("mine");
    expect(ref.current?.hasAttribute("data-ok-color")).toBe(false);
  });
});

describe("FormGroup", () => {
  it("a wrapping column; row lays the controls side by side", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <>
        <FormGroup ref={ref} data-testid="col" role="group" aria-label="Column">
          <FormControlLabel label="One" control={<Checkbox />} />
          <FormControlLabel label="Two" control={<Checkbox />} />
        </FormGroup>
        <FormGroup row data-testid="row">
          <FormControlLabel label="Three" control={<Checkbox />} />
          <FormControlLabel label="Four" control={<Checkbox />} />
        </FormGroup>
      </>,
    );
    const col = screen.getByTestId("col");
    expect(ref.current).toBe(col);
    expect({ ...col.dataset }).toEqual({ testid: "col", okFormGroup: "" });
    expect([css(col).display, css(col).flexDirection, css(col).flexWrap]).toEqual([
      "flex",
      "column",
      "wrap",
    ]);
    const row = screen.getByTestId("row");
    expect(row.dataset["okRow"]).toBe("");
    expect(css(row).flexDirection).toBe("row");
    const [three, four] = [...row.children].map((c) => c.getBoundingClientRect());
    expect(three?.top).toBe(four?.top);
  });
});

describe("FormHelperText", () => {
  it("a caption paragraph 6px below, in the secondary text color", () => {
    render(
      <FormControl>
        <FormHelperText id="h" data-testid="h">
          Be careful
        </FormHelperText>
      </FormControl>,
    );
    const helper = screen.getByTestId("h");
    expect(helper.localName).toBe("p");
    expect({ ...helper.dataset }).toEqual({ testid: "h", okFormHelperText: "" });
    const style = css(helper);
    expect([style.marginTop, style.marginLeft, style.marginRight, style.marginBottom]).toEqual([
      "6px",
      "0px",
      "0px",
      "0px",
    ]);
    expect(style.fontSize).toBe("12px");
    expect(style.color).toBe(color("var(--ok-text-secondary)"));
  });

  it("follows the FormControl's error, margin and variant; disabled keeps AA text", () => {
    render(
      <>
        <FormControl error margin="dense" variant="outlined">
          <FormHelperText data-testid="a">A</FormHelperText>
        </FormControl>
        <FormControl variant="filled" disabled>
          <FormHelperText data-testid="b">B</FormHelperText>
          <FormHelperText variant="standard" data-testid="c">
            C
          </FormHelperText>
        </FormControl>
      </>,
    );
    const a = css(screen.getByTestId("a"));
    expect(a.color).toBe(color("var(--ok-palette-error-text)"));
    expect([a.marginTop, a.marginLeft, a.marginRight]).toEqual(["4px", "12px", "12px"]);
    const b = css(screen.getByTestId("b"));
    expect(b.marginLeft).toBe("12px");
    expect(b.color).toBe(color("var(--ok-text-secondary)"));
    expect(css(screen.getByTestId("c")).marginLeft).toBe("0px");
  });

  it("its own props: error, margin, variant, other states; component and ref", () => {
    const ref = createRef<HTMLElement>();
    render(
      <>
        <FormHelperText error margin="dense" variant="outlined" data-testid="own">
          Own
        </FormHelperText>
        <FormHelperText
          ref={ref}
          component="span"
          disabled
          required
          focused
          filled
          margin={HOSTILE}
          variant={HOSTILE}
        >
          Span
        </FormHelperText>
      </>,
    );
    const own = screen.getByTestId("own");
    expect(css(own).color).toBe(color("var(--ok-palette-error-text)"));
    expect([css(own).marginTop, css(own).marginLeft]).toEqual(["4px", "12px"]);
    expect(ref.current?.localName).toBe("span");
    expect({ ...ref.current?.dataset }).toEqual({
      okFormHelperText: "",
      okDisabled: "",
      okRequired: "",
      okFocused: "",
      okFilled: "",
    });
  });
});

describe("Form control rendering", () => {
  const groups = (p = "") => (
    <>
      <FormControl component="fieldset" required error aria-describedby={`${p}pick-helper`}>
        <FormLabel component="legend">Pick two</FormLabel>
        <FormGroup>
          <FormControlLabel label="Gilad" control={<Checkbox aria-invalid="true" />} />
          <FormControlLabel label="Jason" control={<Checkbox aria-invalid="true" />} />
        </FormGroup>
        <FormHelperText id={`${p}pick-helper`}>You can display an error</FormHelperText>
      </FormControl>
      <FormControl component="fieldset" disabled>
        <FormLabel component="legend" id={`${p}plan`}>
          Plan
        </FormLabel>
        <RadioGroup
          name={`${p}plan`}
          aria-labelledby={`${p}plan`}
          aria-describedby={`${p}plan-helper`}
        >
          <FormControlLabel label="Free" control={<Radio value="free" />} />
        </RadioGroup>
        <FormHelperText id={`${p}plan-helper`}>Managed by your organization</FormHelperText>
      </FormControl>
      <FormControl focused color="primary">
        <FormLabel htmlFor={`${p}alone`}>Alone</FormLabel>
        <Switch id={`${p}alone`} aria-describedby={`${p}alone-helper`} />
        <FormHelperText id={`${p}alone-helper`}>Helper</FormHelperText>
      </FormControl>
    </>
  );

  it("names groups and links helper texts", () => {
    render(groups());
    const pick = screen.getByRole("group", { name: "Pick two" });
    expect(pick.getAttribute("aria-describedby")).toBe("pick-helper");
    expect(screen.getByRole("radiogroup", { name: "Plan" })).toBeTruthy();
    expect(screen.getByRole("switch", { name: "Alone" }).getAttribute("aria-describedby")).toBe(
      "alone-helper",
    );
  });

  it("renders on the server (same markup in StrictMode) and has no axe violations", async () => {
    const markup = renderToString(groups());
    expect(markup).toContain('<fieldset data-ok-form-control="" data-ok-disabled=""');
    expect(markup).toContain(
      'Pick two<span data-ok-form-label-asterisk="" aria-hidden="true">*</span></legend>',
    );
    expect(renderToString(<StrictMode>{groups()}</StrictMode>)).toBe(markup);
    const { container } = render(
      <>
        {groups()}
        <div data-ok-theme="dark" style={{ background: "var(--ok-bg-default)" }}>
          {groups("dark-")}
        </div>
      </>,
    );
    await expectNoAxeViolations(container);
  });
});
