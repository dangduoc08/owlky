import { uploadOptions } from "@owlky/core";
import { Button, Upload, UploadAvatar, UploadBox, UploadCloudIcon } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import type { GroupFiles } from "../shared/snippets.js";
import { MultipleDemo } from "./multiple-demo.js";

/**
 * Story groups — the same examples as `packages/html/src/components/upload/examples/`. The
 * examples hold no state of their own (each Upload keeps its files), so Controls reach them.
 */
export const uploadStories: Record<string, ReactGroup[]> = {
  single: [{ title: "Upload single file", content: <Upload /> }],
  multiple: [{ title: "Upload multi file", content: <MultipleDemo /> }],
  avatar: [
    {
      title: "Upload avatar",
      content: (
        <UploadAvatar
          accept="image/jpeg,image/png,image/gif"
          maxSize={3145728}
          helperText="Allowed *.jpeg, *.jpg, *.png, *.gif, max size of 3 MB"
        />
      ),
    },
  ],
  box: [
    {
      title: "Upload box",
      content: (
        <div className="sb-upload-boxes">
          <UploadBox />
          <UploadBox
            placeholder={
              <>
                <UploadCloudIcon />
                <span>Upload file</span>
              </>
            }
          />
        </div>
      ),
    },
  ],
  validation: [
    {
      title: "Validation",
      content: (
        <Upload
          multiple
          accept={{ "image/*": [".png", ".jpg", ".jpeg"] }}
          maxFiles={3}
          maxSize={1048576}
          helperText="PNG or JPEG images, up to 1 MB each and 3 files at most."
        />
      ),
    },
  ],
  states: [
    { title: "Error", content: <Upload error helperText="Add a file to continue." /> },
    { title: "Disabled", content: <Upload disabled /> },
  ],
  "open-dialog": [
    {
      title: "Open the file dialog",
      content: (
        <Upload
          multiple
          noClick
          noKeyboard
          aria-label="Files"
          placeholder={
            <div className="sb-upload-open">
              <span>Drag files here</span>
              <Button variant="outlined" color="inherit" data-ok-upload-open="">
                Open file dialog
              </Button>
            </div>
          }
        />
      ),
    },
  ],
};

/** Group title ↔ snippet file suffix. */
export const UPLOAD_FILES: Record<string, GroupFiles> = Object.fromEntries(
  Object.entries(uploadStories).map(([story, groups]) => [
    story,
    groups.map(
      (group, index) => [group.title, groups.length > 1 ? `group-${index + 1}` : "group"] as const,
    ),
  ]),
);

/** Story Controls shared by the React and HTML stories (ADR-0015). */
export const UPLOAD_CONTROLS = {
  schema: uploadOptions,
  keys: ["error", "disabled", "noClick", "noDrag", "noKeyboard", "maxSize"],
} as const;

/** The multi file story adds the list's options. */
export const MULTIPLE_CONTROLS = {
  schema: uploadOptions,
  keys: ["layout", "thumbnail", "maxFiles", "disabled", "noClick", "noDrag"],
} as const;
