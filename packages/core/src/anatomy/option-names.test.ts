import { describe, expect, it } from "vitest";
import * as anatomy from "./anatomy.js";

interface Schema {
  name: string;
  root: string;
  options: Record<string, { attr?: string }>;
}

const schemas = (Object.values(anatomy) as unknown[]).filter(
  (value): value is Schema =>
    typeof value === "object" && value !== null && "root" in value && "options" in value,
);

/**
 * Option attributes that may equal another component's root: a surface built on that component
 * (the element really is one), or a name that was checked to be harmless.
 */
const ALLOWED = new Set([
  "card:data-ok-paper",
  "link:data-ok-typography",
  // `slider.css` loads after `stepper.css`, and the Stepper runtime only reads its own children.
  "slider:data-ok-step",
]);

describe("option attribute names", () => {
  it("finds the schemas", () => expect(schemas.length).toBeGreaterThan(50));

  // A chart's `data-ok-tooltip` once picked up the Tooltip's CSS and started its runtime.
  it("never reuse the root attribute of another component", () => {
    const roots = new Map(schemas.map((schema) => [schema.root, schema.name]));
    const clashes = schemas.flatMap((schema) =>
      Object.values(schema.options).flatMap(({ attr }) => {
        const owner = attr === undefined ? undefined : roots.get(attr);
        return owner === undefined || owner === schema.name || ALLOWED.has(`${schema.name}:${attr}`)
          ? []
          : [`${schema.name}: ${attr} is the root of ${owner}`];
      }),
    );
    expect(clashes).toEqual([]);
  });
});
