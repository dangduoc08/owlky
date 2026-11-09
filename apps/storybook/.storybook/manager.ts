import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";
import "./code-copy.js";
import "./toolbar.js";

addons.setConfig({
  theme: create({ base: "light", brandTitle: "Owlky", colorSecondary: "#00A76F" }),
});
