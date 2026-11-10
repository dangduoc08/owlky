import { describe, expect, it } from "vitest";
import {
  optionSchemas,
  walktourAttributes,
  walktourOptions,
  walktourStepAttributes,
  walktourStepOverrides,
} from "../anatomy/anatomy.js";
import { walktourStepFlags } from "./walktour-controller.js";

describe("walktourAttributes", () => {
  it("writes only the root marker by default", () => {
    expect(walktourAttributes()).toEqual({ "data-ok-walktour": "" });
  });

  it("writes every option that is on, and valid numbers only", () => {
    expect(
      walktourAttributes({
        continuous: true,
        showProgress: true,
        showSkipButton: true,
        hideBackButton: true,
        hideCloseButton: true,
        disableBeacon: true,
        disableCloseOnEsc: true,
        disableOverlay: true,
        disableOverlayClose: true,
        spotlightClicks: true,
        disableScrolling: true,
        scrollToFirstStep: true,
        spotlightPadding: 12,
        spotlightRadius: 8,
        scrollOffset: 60,
      }),
    ).toEqual({
      "data-ok-walktour": "",
      "data-ok-continuous": "",
      "data-ok-show-progress": "",
      "data-ok-show-skip-button": "",
      "data-ok-hide-back-button": "",
      "data-ok-hide-close-button": "",
      "data-ok-disable-beacon": "",
      "data-ok-disable-close-on-esc": "",
      "data-ok-disable-overlay": "",
      "data-ok-disable-overlay-close": "",
      "data-ok-spotlight-clicks": "",
      "data-ok-disable-scrolling": "",
      "data-ok-scroll-to-first-step": "",
      "data-ok-spotlight-padding": "12",
      "data-ok-spotlight-radius": "8",
      "data-ok-scroll-offset": "60",
    });
    expect(walktourAttributes({ spotlightPadding: -1, continuous: false })).toEqual({
      "data-ok-walktour": "",
    });
  });

  it("is registered, and its step flags match the controller's", () => {
    expect(optionSchemas.walktour).toBe(walktourOptions);
    expect(walktourStepOverrides.map((key) => walktourOptions.options[key].attr)).toEqual([
      ...walktourStepFlags,
    ]);
  });
});

describe("walktourStepAttributes", () => {
  it("writes the placement (default bottom) and the valid numbers", () => {
    expect(walktourStepAttributes()).toEqual({
      "data-ok-walktour-step": "",
      "data-ok-placement": "bottom",
    });
    expect(
      walktourStepAttributes({ placement: "center", spotlightPadding: 4, width: 480 }),
    ).toEqual({
      "data-ok-walktour-step": "",
      "data-ok-placement": "center",
      "data-ok-spotlight-padding": "4",
      "data-ok-width": "480",
    });
    expect(walktourStepAttributes({ placement: "sideways" as never, width: Number.NaN })).toEqual({
      "data-ok-walktour-step": "",
      "data-ok-placement": "bottom",
    });
  });

  it("writes overrides as on or off, and a selector target", () => {
    expect(
      walktourStepAttributes({
        disableBeacon: true,
        showSkipButton: false,
        target: "#inbox",
      }),
    ).toEqual({
      "data-ok-walktour-step": "",
      "data-ok-placement": "bottom",
      "data-ok-disable-beacon": "",
      "data-ok-show-skip-button": "false",
      "data-ok-target": "#inbox",
    });
    expect(walktourStepAttributes({ target: "" })).not.toHaveProperty("data-ok-target");
  });

  it("writes the step options of 4.17 only when given, and other targets as selectors", () => {
    expect(
      walktourStepAttributes({
        beaconPlacement: "left-end",
        isFixed: true,
        beaconTrigger: "hover",
        closeButtonAction: "skip",
        scrollDuration: 0,
        targetWaitTimeout: 500,
        beforeTimeout: 0,
        disableFocusTrap: true,
        scrollTarget: "#list",
        spotlightTarget: "#card",
      }),
    ).toEqual({
      "data-ok-walktour-step": "",
      "data-ok-placement": "bottom",
      "data-ok-beacon-placement": "left-end",
      "data-ok-is-fixed": "",
      "data-ok-beacon-trigger": "hover",
      "data-ok-close-button-action": "skip",
      "data-ok-scroll-duration": "0",
      "data-ok-target-wait-timeout": "500",
      "data-ok-before-timeout": "0",
      "data-ok-disable-focus-trap": "",
      "data-ok-scroll-target": "#list",
      "data-ok-spotlight-target": "#card",
    });
    expect(walktourStepAttributes({ beaconTrigger: "wiggle" as never })).toEqual({
      "data-ok-walktour-step": "",
      "data-ok-placement": "bottom",
    });
  });
});

describe("walktourAttributes (4.17)", () => {
  it("writes the trigger and close action only when given, and the waits", () => {
    expect(
      walktourAttributes({
        beaconTrigger: "hover",
        closeButtonAction: "skip",
        disableFocusTrap: true,
        scrollDuration: 600,
        targetWaitTimeout: 0,
        beforeTimeout: 2000,
      }),
    ).toEqual({
      "data-ok-walktour": "",
      "data-ok-beacon-trigger": "hover",
      "data-ok-close-button-action": "skip",
      "data-ok-disable-focus-trap": "",
      "data-ok-scroll-duration": "600",
      "data-ok-target-wait-timeout": "0",
      "data-ok-before-timeout": "2000",
    });
  });
});
