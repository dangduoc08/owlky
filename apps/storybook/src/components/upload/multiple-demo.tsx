import { Upload } from "@owlky/react";

/** Several files with the Remove all and Upload buttons (sending the files is up to you). */
export function MultipleDemo() {
  return (
    <Upload
      multiple
      onRemoveAll={() => {}}
      onUpload={(files) => {
        // Send the files to your server here, for example with fetch() and FormData.
        void files;
      }}
    />
  );
}
