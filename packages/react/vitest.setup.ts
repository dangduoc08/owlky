// Tests run against the same prebuilt CSS consumers get (build @owlky/styles first).
import "@owlky/styles/owlky.css";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute("style");
});
