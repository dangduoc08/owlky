import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";

const pkg = (path: string) => fileURLToPath(new URL(`../../../packages/${path}`, import.meta.url));

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: { name: "@storybook/react-vite", options: {} },
  core: { disableTelemetry: true },
  async viteFinal(viteConfig) {
    const { mergeConfig } = await import("vite");
    const { default: tailwindcss } = await import("@tailwindcss/vite");
    return mergeConfig(viteConfig, {
      plugins: [tailwindcss()],
      resolve: {
        // Stories run against package *sources* for instant feedback. Published output is
        // verified separately (examples/, check:packages, e2e plain-html test).
        alias: [
          { find: /^@owlky\/core$/, replacement: pkg("core/src/index.ts") },
          { find: /^@owlky\/react$/, replacement: pkg("react/src/index.ts") },
          { find: /^@owlky\/html$/, replacement: pkg("html/src/index.ts") },
          { find: /^@owlky\/html\/auto$/, replacement: pkg("html/src/auto.ts") },
          { find: /^@snippets\//, replacement: `${pkg("html/src/components")}/` },
        ],
      },
    });
  },
};

export default config;
