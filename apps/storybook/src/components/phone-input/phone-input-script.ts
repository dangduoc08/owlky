/*
 * HTML phone input stories: the page script that writes each field's values under it (what the
 * React demos show from `onChange`), and its Code panel source.
 */
import { getRuntime, phoneInput } from "@owlky/html";
import type { HtmlGroup } from "../../helpers/groups.js";

type Script = NonNullable<HtmlGroup["script"]>;
interface Details {
  value: string;
  national: string;
  international: string;
}

/** Registers the phone input, mounts the row and keeps each field's values up to date. */
export const phoneScript: Script = (row) => {
  getRuntime().register(phoneInput).init(row);
  const controller = new AbortController();
  for (const demo of row.querySelectorAll<HTMLElement>(".sb-phone-demo")) {
    demo.addEventListener(
      "ok:phone-input:change",
      (event) => {
        const details = (event as CustomEvent<Details>).detail;
        const write = (name: string, text: string) => {
          const cell = demo.querySelector(`.sb-phone-${name}`);
          if (cell) cell.textContent = text || "-";
        };
        write("national", details.national);
        write("international", details.international);
        write("raw", details.value);
      },
      { signal: controller.signal },
    );
  }
  return () => controller.abort();
};

export const PHONE_SCRIPT_SOURCE = `import "@owlky/html/phone"; // on a CDN page, owlky.js loads the phone input by itself

// Show the number's forms under each field.
for (const demo of document.querySelectorAll(".sb-phone-demo")) {
  demo.addEventListener("ok:phone-input:change", (event) => {
    const { national, international, value } = event.detail;
    demo.querySelector(".sb-phone-national").textContent = national || "-";
    demo.querySelector(".sb-phone-international").textContent = international || "-";
    demo.querySelector(".sb-phone-raw").textContent = value || "-";
  });
}`;
