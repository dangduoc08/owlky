import { defaultTheme, paletteColorNames, shadowNames } from "@minimal-tailwind/tokens";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = { title: "Foundations/Tokens" } satisfies Meta;
export default meta;

const Swatch = ({ name, value }: { name: string; value: string }) => (
  <div className="grid gap-1 text-caption">
    <div className="h-12 w-24 rounded-md border border-divider" style={{ background: value }} />
    <code>{name}</code>
  </div>
);

export const Palette: StoryObj = {
  render: () => (
    <div className="grid gap-6">
      {paletteColorNames.map((color) => (
        <div key={color} className="flex flex-wrap gap-3">
          {(["lighter", "light", "main", "dark", "darker"] as const).map((shade) => (
            <Swatch
              key={shade}
              name={`${color}-${shade}`}
              value={`var(--mt-palette-${color}-${shade})`}
            />
          ))}
        </div>
      ))}
      <div className="flex flex-wrap gap-3">
        {Object.keys(defaultTheme.grey).map((shade) => (
          <Swatch key={shade} name={`grey-${shade}`} value={`var(--mt-palette-grey-${shade})`} />
        ))}
      </div>
    </div>
  ),
};

export const Typography: StoryObj = {
  render: () => (
    <div className="grid gap-3">
      {Object.keys(defaultTheme.typography.variants).map((variant) => (
        <div
          key={variant}
          style={{
            fontSize: `var(--mt-typography-${variant}-font-size)`,
            lineHeight: `var(--mt-typography-${variant}-line-height)`,
            fontWeight: `var(--mt-typography-${variant}-font-weight)`,
            textTransform: `var(--mt-typography-${variant}-text-transform)` as "none",
          }}
        >
          {variant} — The quick brown fox
        </div>
      ))}
    </div>
  ),
};

export const Shadows: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-8 p-6">
      {shadowNames.map((name) => (
        <div
          key={name}
          className="grid h-24 w-32 place-items-center rounded-xl bg-paper text-caption"
          style={{ boxShadow: `var(--mt-shadow-${name})` }}
        >
          {name}
        </div>
      ))}
    </div>
  ),
};
