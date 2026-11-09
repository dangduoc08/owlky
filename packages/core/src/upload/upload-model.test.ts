import { describe, expect, it } from "vitest";
import { uploadAttributes, uploadOptions } from "../anatomy/anatomy.js";
import {
  evaluateUploadFiles,
  flattenUploadAccept,
  formatUploadSize,
  uploadAcceptAttr,
  uploadAcceptPatterns,
  uploadDragVerdict,
  uploadError,
  uploadFileAccepted,
  uploadFileExtension,
  uploadFileKind,
  uploadFileLabel,
  uploadIsImage,
  uploadPickerTypes,
  uploadUrlName,
} from "./upload-model.js";

const file = (name: string, type = "", size = 1) =>
  new File([new Uint8Array(size)], name, { type });

describe("upload anatomy", () => {
  it("writes the style defaults and only the options that are on", () => {
    expect(uploadAttributes()).toEqual({
      "data-ok-upload": "",
      "data-ok-variant": "default",
      "data-ok-layout": "vertical",
    });
    expect(
      uploadAttributes({
        variant: "avatar",
        layout: "horizontal",
        error: true,
        maxFiles: 3,
        maxSize: 1024,
        minSize: 2,
        noClick: true,
        noKeyboard: true,
        noDrag: true,
        noDragEventsBubbling: true,
        noPaste: true,
        useFsAccessApi: true,
        thumbnail: false,
        preventDropOnDocument: false,
      }),
    ).toEqual({
      "data-ok-upload": "",
      "data-ok-variant": "avatar",
      "data-ok-layout": "horizontal",
      "data-ok-error": "",
      "data-ok-max-files": "3",
      "data-ok-max-size": "1024",
      "data-ok-min-size": "2",
      "data-ok-no-click": "",
      "data-ok-no-keyboard": "",
      "data-ok-no-drag": "",
      "data-ok-no-drag-events-bubbling": "",
      "data-ok-no-paste": "",
      "data-ok-use-fs-access-api": "",
      "data-ok-thumbnail": "false",
      "data-ok-prevent-drop-on-document": "false",
    });
  });

  it("falls back to defaults for invalid values (untrusted input never reaches the DOM)", () => {
    const attrs = uploadAttributes({
      variant: '"><img onerror>' as never,
      maxSize: Number.NaN,
      maxFiles: -1,
      thumbnail: true,
    });
    expect(attrs["data-ok-variant"]).toBe("default");
    expect(attrs["data-ok-max-size"]).toBeUndefined();
    expect(attrs["data-ok-max-files"]).toBeUndefined();
    expect(attrs["data-ok-thumbnail"]).toBeUndefined();
  });

  it("puts multiple and disabled on the input", () => {
    expect(uploadOptions.options.multiple.children).toBe("[data-ok-upload-input]");
    expect(uploadOptions.options.disabled.children).toBe("[data-ok-upload-input]");
  });
});

describe("accept", () => {
  it("keeps valid MIME types, wildcards and extensions only", () => {
    expect(uploadAcceptAttr(undefined)).toBe("");
    expect(uploadAcceptAttr(" image/* , .PDF, nonsense, a/b/c, .tar.gz,image/*")).toBe(
      "image/*,.pdf,.tar.gz",
    );
    expect(uploadAcceptAttr(`.${"x".repeat(200)}`)).toBe("");
    expect(uploadAcceptAttr('"><img src=x onerror=alert(1)>')).toBe("");
  });

  it("reads a MIME → extensions map; wildcards paired with extensions keep only the extensions", () => {
    expect(uploadAcceptAttr({ "image/*": [".png", ".jpg"], "application/pdf": [] })).toBe(
      ".png,.jpg,application/pdf",
    );
    expect(uploadAcceptAttr({ "text/plain": ".txt", "bad key": [".x", "y"] })).toBe(
      "text/plain,.txt,.x",
    );
  });

  it("flattens labeled groups", () => {
    const groups = [
      { description: "Images", accept: { "image/png": [".png"] } },
      { accept: { "image/png": ".apng", "application/pdf": [".pdf"] } },
    ];
    expect(flattenUploadAccept(groups)).toEqual({
      "image/png": [".png", ".apng"],
      "application/pdf": [".pdf"],
    });
    expect(flattenUploadAccept("image/*")).toBe("image/*");
    expect(flattenUploadAccept(undefined)).toBeUndefined();
    const map = { "image/*": [] };
    expect(flattenUploadAccept(map)).toBe(map);
    expect(uploadAcceptAttr(groups)).toBe("image/png,.png,.apng,application/pdf,.pdf");
    expect(uploadAcceptPatterns("image/*,.pdf")).toEqual(["image/*", ".pdf"]);
    expect(uploadAcceptPatterns(null)).toEqual([]);
  });

  it("matches files by extension, MIME type or wildcard", () => {
    expect(uploadFileAccepted(file("a.PNG", "image/png"), "")).toBe(true);
    expect(uploadFileAccepted(file("a.PNG"), ".png")).toBe(true);
    expect(uploadFileAccepted(file("a.gif", "image/gif"), "image/*")).toBe(true);
    expect(uploadFileAccepted(file("a.txt", "text/plain; charset=utf-8"), "text/plain")).toBe(true);
    expect(uploadFileAccepted(file("a.txt", "text/plain"), "image/*,.pdf")).toBe(false);
    expect(uploadFileAccepted(file("a.pdf", "application/pdf"), "application/zip")).toBe(false);
  });
});

describe("sizes and errors", () => {
  it("formats bytes with binary units", () => {
    expect(formatUploadSize(0)).toBe("0 bytes");
    expect(formatUploadSize(1)).toBe("1 byte");
    expect(formatUploadSize(70)).toBe("70 bytes");
    expect(formatUploadSize(240000, "en")).toBe("234.38 KB");
    expect(formatUploadSize(3 * 1024 * 1024, "en")).toBe("3 MB");
    expect(formatUploadSize(5 * 1024 ** 5, "en")).toBe("5,120 TB");
    expect(formatUploadSize(-1)).toBe("");
    expect(formatUploadSize(Number.NaN)).toBe("");
  });

  it("builds the built-in messages", () => {
    expect(uploadError("file-invalid-type", { accept: "image/*" }).message).toBe(
      "File type must be image/*",
    );
    expect(uploadError("file-invalid-type", { accept: "image/*,.pdf" }).message).toBe(
      "File type must be one of image/*, .pdf",
    );
    expect(uploadError("file-invalid-type").message).toBe("File type must be accepted");
    expect(uploadError("file-too-large", { maxSize: 1024 }).message).toBe(
      "File is larger than 1 KB",
    );
    expect(uploadError("file-too-large").message).toBe("File is larger than 0 bytes");
    expect(uploadError("file-too-small", { minSize: 10 }).message).toBe(
      "File is smaller than 10 bytes",
    );
    expect(uploadError("file-too-small").message).toBe("File is smaller than 0 bytes");
    expect(uploadError("too-many-files")).toEqual({
      code: "too-many-files",
      message: "Too many files",
    });
  });
});

describe("evaluateUploadFiles", () => {
  const png = file("a.png", "image/png", 10);
  const big = file("b.png", "image/png", 5000);
  const txt = file("c.txt", "text/plain", 10);

  it("rejects by type and size, with every reason", () => {
    const { accepted, rejections } = evaluateUploadFiles([png, big, txt], {
      accept: "image/*",
      maxSize: 100,
      minSize: 5,
      multiple: true,
    });
    expect(accepted).toEqual([png]);
    expect(rejections.map((r) => [r.file.name, r.errors.map((e) => e.code)])).toEqual([
      ["b.png", ["file-too-large"]],
      ["c.txt", ["file-invalid-type"]],
    ]);
    const small = evaluateUploadFiles([png], { minSize: 50 });
    expect(small.rejections[0]?.errors[0]?.code).toBe("file-too-small");
  });

  it("adds validator errors (one, a list, or none) and ignores malformed ones", () => {
    const { accepted, rejections } = evaluateUploadFiles(
      [png, big, txt],
      { multiple: true },
      {
        custom: [
          null,
          { code: "custom", message: "No" },
          [{ code: "a", message: "A" }, { code: 1 } as never, null as never],
        ],
      },
    );
    expect(accepted).toEqual([png]);
    expect(rejections.map((r) => r.errors.map((e) => e.code))).toEqual([["custom"], ["a"]]);
    expect(evaluateUploadFiles([png], {}, { custom: [[]] }).accepted).toEqual([png]);
  });

  it("caps single uploads at one file and multiple ones at maxFiles minus the held files", () => {
    const one = evaluateUploadFiles([png, txt], {});
    expect(one.accepted).toEqual([png]);
    expect(one.rejections[0]?.errors[0]?.code).toBe("too-many-files");
    const capped = evaluateUploadFiles(
      [png, txt, big],
      { multiple: true, maxFiles: 3 },
      {
        existing: 2,
      },
    );
    expect(capped.accepted).toEqual([png]);
    expect(capped.rejections).toHaveLength(2);
    const full = evaluateUploadFiles([png], { multiple: true, maxFiles: 1 }, { existing: 4 });
    expect(full.accepted).toEqual([]);
    const unlimited = evaluateUploadFiles([png, txt, big], { multiple: true, maxFiles: 0 });
    expect(unlimited.accepted).toHaveLength(3);
  });

  it("rewrites messages with getErrorMessage (strings only)", () => {
    const { rejections } = evaluateUploadFiles(
      [txt, png],
      { accept: ".png" },
      {
        getErrorMessage: (error, f) => (f.name === "c.txt" ? `Nope: ${error.code}` : (7 as never)),
      },
    );
    expect(rejections[0]?.errors[0]?.message).toBe("Nope: file-invalid-type");
    const many = evaluateUploadFiles([png, png], {}, { getErrorMessage: () => "Max" });
    expect(many.rejections[0]?.errors[0]?.message).toBe("Max");
  });
});

describe("uploadDragVerdict", () => {
  it("rejects too many files", () => {
    expect(uploadDragVerdict(["image/png", "image/png"], {})).toBe("reject");
    expect(uploadDragVerdict(["a/b"], { multiple: true, maxFiles: 2 }, { existing: 2 })).toBe(
      "reject",
    );
  });

  it("checks known MIME types against accept", () => {
    expect(uploadDragVerdict(["image/png"], { accept: "image/*" })).toBe("accept");
    expect(uploadDragVerdict(["text/plain"], { accept: "image/*" })).toBe("reject");
    expect(uploadDragVerdict(["text/plain"], {})).toBe("accept");
  });

  it("is unknown when only the drop can tell (no type, extensions, a validator)", () => {
    expect(uploadDragVerdict([""], { accept: "image/*" })).toBe("unknown");
    expect(uploadDragVerdict(["text/plain"], { accept: ".txt" })).toBe("unknown");
    expect(uploadDragVerdict(["image/png"], { accept: "image/*,.pdf" })).toBe("accept");
    expect(uploadDragVerdict(["image/png"], {}, { validator: true })).toBe("unknown");
  });
});

describe("file kinds and names", () => {
  it("finds kinds from the extension, then the MIME type", () => {
    expect(uploadFileKind({ name: "a.PDF" })).toBe("pdf");
    expect(uploadFileKind({ name: "a.docx" })).toBe("document");
    expect(uploadFileKind({ name: "a.csv" })).toBe("spreadsheet");
    expect(uploadFileKind({ name: "a.key" })).toBe("presentation");
    expect(uploadFileKind({ name: "a.tgz" })).toBe("archive");
    expect(uploadFileKind({ name: "a.md" })).toBe("text");
    expect(uploadFileKind({ name: "a.ts" })).toBe("code");
    expect(uploadFileKind({ name: "a.mp3" })).toBe("audio");
    expect(uploadFileKind({ name: "a.webm" })).toBe("video");
    expect(uploadFileKind({ name: "blob", type: "application/pdf" })).toBe("pdf");
    expect(uploadFileKind({ name: "blob", type: "image/x-raw" })).toBe("image");
    expect(uploadFileKind({ name: "blob", type: "video/x" })).toBe("video");
    expect(uploadFileKind({ name: "blob" })).toBe("other");
  });

  it("previews browser-decodable images only", () => {
    expect(uploadIsImage({ name: "a.png" })).toBe(true);
    expect(uploadIsImage({ name: "a.heic" })).toBe(false);
    expect(uploadIsImage({ name: "a.txt" })).toBe(false);
  });

  it("reads extensions, labels and URL names", () => {
    expect(uploadFileExtension("archive.tar.GZ")).toBe("gz");
    expect(uploadFileExtension("no-extension")).toBe("");
    expect(uploadFileLabel("photo.jpeg")).toBe("JPEG");
    expect(uploadFileLabel("x.markdown")).toBe("MARK");
    expect(uploadUrlName("https://example.com/a/My%20photo.png?size=2#x")).toBe("My photo.png");
    expect(uploadUrlName("https://example.com/a/%E0%A4%A.png")).toBe("%E0%A4%A.png");
    expect(uploadUrlName("")).toBe("");
  });
});

describe("uploadPickerTypes", () => {
  it("builds one picker row per group, extension-only patterns under octet-stream", () => {
    expect(uploadPickerTypes(undefined)).toEqual([]);
    expect(uploadPickerTypes("image/*,.pdf")).toEqual([
      { accept: { "image/*": [], "application/octet-stream": [".pdf"] } },
    ]);
    expect(
      uploadPickerTypes([
        { description: "Images", accept: { "image/*": [".png", "bad"] } },
        { accept: { "nope nope": [".x"] } },
      ]),
    ).toEqual([{ description: "Images", accept: { "image/*": [".png"] } }]);
    expect(uploadPickerTypes({ "application/pdf": ".pdf" })).toEqual([
      { accept: { "application/pdf": [".pdf"] } },
    ]);
  });
});
