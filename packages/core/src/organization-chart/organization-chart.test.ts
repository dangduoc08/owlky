import { describe, expect, it } from "vitest";
import {
  organizationChartAttributes,
  organizationChartOptions,
  readNumber,
  readStyle,
} from "../index.js";
import { ORGANIZATION_CHART_LENGTHS, organizationChartStyle } from "./organization-chart.js";

const HOSTILE = '"><img src=x onerror=alert(1)>';

describe("organizationChartAttributes", () => {
  it("writes the explicit style defaults and no lengths", () => {
    expect(organizationChartAttributes()).toEqual({
      "data-ok-organization-chart": "",
      "data-ok-line-color": "divider",
      "data-ok-line-style": "solid",
    });
  });

  it("writes every option value", () => {
    expect(
      organizationChartAttributes({
        lineHeight: 20,
        lineWidth: "2px",
        lineColor: "primary",
        lineStyle: "dashed",
        lineBorderRadius: "0.5rem",
        nodePadding: 8,
      }),
    ).toEqual({
      "data-ok-organization-chart": "",
      "data-ok-line-height": "20",
      "data-ok-line-width": "2px",
      "data-ok-line-color": "primary",
      "data-ok-line-style": "dashed",
      "data-ok-line-border-radius": "0.5rem",
      "data-ok-node-padding": "8",
    });
  });

  it("drops invalid values (unknown enums, negative or hostile lengths)", () => {
    expect(
      organizationChartAttributes({
        lineHeight: -4,
        lineWidth: "calc(1px + 1px)",
        lineColor: HOSTILE as never,
        lineStyle: "groove" as never,
        lineBorderRadius: HOSTILE,
        nodePadding: Number.NaN,
      }),
    ).toEqual({
      "data-ok-organization-chart": "",
      "data-ok-line-color": "divider",
      "data-ok-line-style": "solid",
    });
  });

  it("accepts every color and style of the schema", () => {
    for (const lineColor of organizationChartOptions.options.lineColor.values)
      expect(organizationChartAttributes({ lineColor })["data-ok-line-color"]).toBe(lineColor);
    for (const lineStyle of organizationChartOptions.options.lineStyle.values)
      expect(organizationChartAttributes({ lineStyle })["data-ok-line-style"]).toBe(lineStyle);
  });

  it("reads options back from the markup, with defaults", () => {
    const element = document.createElement("ul");
    const { options } = organizationChartOptions;
    expect(readNumber(element, options.lineHeight)).toBe(40);
    expect(readNumber(element, options.lineWidth)).toBe(1);
    expect(readNumber(element, options.lineBorderRadius)).toBe(24);
    expect(readNumber(element, options.nodePadding)).toBe(4);
    expect(readStyle(element, options.lineColor)).toBe("divider");
    element.setAttribute("data-ok-line-height", "3em");
    element.setAttribute("data-ok-line-color", "warning");
    expect(readNumber(element, options.lineHeight)).toBe("3em");
    expect(readStyle(element, options.lineColor)).toBe("warning");
  });
});

describe("organizationChartStyle", () => {
  it("is empty without values (the stylesheet's defaults apply)", () => {
    expect(organizationChartStyle({})).toEqual({});
  });

  it("turns numbers into px and keeps lengths with units", () => {
    expect(
      organizationChartStyle({
        lineHeight: 20,
        lineWidth: "2px",
        lineBorderRadius: "0.75rem",
        nodePadding: "1.5em",
      }),
    ).toEqual({
      "--_ok-org-line-height": "20px",
      "--_ok-org-line-width": "2px",
      "--_ok-org-line-radius": "0.75rem",
      "--_ok-org-node-padding": "1.5em",
    });
  });

  it("leaves out invalid values", () => {
    expect(
      organizationChartStyle({
        lineHeight: "-1px",
        lineWidth: HOSTILE,
        lineBorderRadius: "1e999",
        nodePadding: { toString: () => "4px" },
      }),
    ).toEqual({});
  });

  it("names one private property per length option", () => {
    expect(Object.keys(ORGANIZATION_CHART_LENGTHS)).toEqual([
      "lineHeight",
      "lineWidth",
      "lineBorderRadius",
      "nodePadding",
    ]);
    for (const name of Object.values(ORGANIZATION_CHART_LENGTHS))
      expect(name).toMatch(/^--_ok-org-/);
  });
});
