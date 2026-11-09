"use client";

import { buttonPreviews } from "@owlky/docs-content/components/button";
import { buttonSections } from "@owlky/docs-content/components/button/sections";
import { GuideSections } from "@owlky/docs-content/guide";
import { type ManifestSchema, manifestOptionSchema } from "@owlky/docs-content/guide/manifest";
import { OptionsTable } from "@owlky/docs-content/guide/tables";

/** The Button guide; its Options table comes from the MCP manifest (ADR-0046). */
export function ButtonGuide({ schemas }: { schemas: readonly ManifestSchema[] }) {
  const previews = {
    ...buttonPreviews,
    options: () =>
      schemas.map((schema) => (
        <OptionsTable key={schema.name} schema={manifestOptionSchema(schema)} />
      )),
  };
  return <GuideSections sections={buttonSections} previews={previews} />;
}
