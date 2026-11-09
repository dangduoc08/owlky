import { defaultTheme } from "@owlky/tokens";
import { writeClipboard } from "../src/helpers/clipboard.js";

/*
 * Code panel Copy button. Storybook's own handler only calls `navigator.clipboard?.writeText`,
 * so it does nothing over plain HTTP (`pnpm storybook:network`) and gives no sign of failure.
 * This listener copies the panel's code with a fallback and writes the result in
 * `data-owlky-copy` (idle | copied | failed); manager-head.html draws the icon button from it.
 * Storybook's handler still runs (it copies the same text where it can): its label change is
 * hidden by the icon styles.
 */

// The manager doesn't load Owlky's CSS: hand the button's colors to manager-head.html.
const { palette, grey, common } = defaultTheme;
for (const [name, value] of Object.entries({
  fg: grey[700],
  bg: grey[100],
  border: grey[300],
  hover: grey[200],
  success: palette.success.main,
  error: palette.error.main,
  on: common.white,
})) {
  document.documentElement.style.setProperty(`--owlky-copy-${name}`, value);
}

const BUTTON = "#storybook-panel-root .docblock-source > div > button";
const timers = new WeakMap<HTMLButtonElement, ReturnType<typeof setTimeout>>();

const setState = (button: HTMLButtonElement, state: "idle" | "copied" | "failed") => {
  button.dataset["owlkyCopy"] = state;
  button.setAttribute(
    "aria-label",
    state === "copied" ? "Copied" : state === "failed" ? "Couldn't copy" : "Copy code",
  );
  button.title = state === "failed" ? "Couldn't copy: select the code and copy it" : "Copy code";
};

document.addEventListener(
  "click",
  (event) => {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>(BUTTON);
    const code = button?.closest(".docblock-source")?.querySelector("pre")?.textContent;
    if (!button || code == null) return;
    void writeClipboard(code.trim()).then((copied) => {
      setState(button, copied ? "copied" : "failed");
      clearTimeout(timers.get(button));
      timers.set(
        button,
        setTimeout(() => setState(button, "idle"), 2000),
      );
    });
  },
  true,
);

// Label the button before its first use (the panel mounts later and re-renders on story changes).
new MutationObserver(() => {
  for (const button of document.querySelectorAll<HTMLButtonElement>(BUTTON)) {
    if (!button.dataset["owlkyCopy"]) setState(button, "idle");
  }
}).observe(document.body, { childList: true, subtree: true });
