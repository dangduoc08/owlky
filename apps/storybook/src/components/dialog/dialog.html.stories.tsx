import basic from "@snippets/dialog/examples/basic.html?raw";
import form from "@snippets/dialog/examples/form.html?raw";
import notDismissible from "@snippets/dialog/examples/not-dismissible.html?raw";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { htmlStory } from "../../helpers/html-story.js";

const meta = { title: "HTML/Dialog" } satisfies Meta;
export default meta;

export const Basic: StoryObj = htmlStory(basic);
export const Form: StoryObj = htmlStory(
  form,
  '`<form method="dialog">` closes the dialog natively on submit; the runtime notices and cleans up (`mt:dialog:close` with `reason: "native"`).',
);
export const NotDismissible: StoryObj = htmlStory(notDismissible);
