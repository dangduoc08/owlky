// Tests run against the same prebuilt CSS consumers get (build @minimal-tailwind/styles first).
import "@minimal-tailwind/styles/minimal-tailwind.css";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute("style");
});
