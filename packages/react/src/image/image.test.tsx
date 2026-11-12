import { imageEffects, imageFits, imagePositions, imageRatios } from "@owlky/core";
import { act, render, screen } from "@testing-library/react";
import { createRef, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test-utils.js";
import { Image } from "./image.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;
const PIXEL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='6'/%3E";
const OTHER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='8'/%3E";
const BROKEN = "data:image/png;base64,AAAA";

/** Resolves once the root's `data-ok-state` is `state` (a MutationObserver, never polling). */
function stateIs(root: Element, state: string): Promise<void> {
  if (root.getAttribute("data-ok-state") === state) return Promise.resolve();
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (root.getAttribute("data-ok-state") !== state) return;
      observer.disconnect();
      resolve();
    });
    observer.observe(root, { attributes: true, attributeFilter: ["data-ok-state"] });
  });
}

const rootOf = (img: Element) => img.parentElement as HTMLElement;

describe("Image", () => {
  it("renders the anatomy with native loading hints", () => {
    render(<Image src={`${PIXEL}#a`} alt="A field" ratio="16/9" />);
    const img = screen.getByRole("img", { name: "A field" });
    const root = rootOf(img);
    expect(root.tagName).toBe("SPAN");
    expect(root.dataset).toMatchObject({
      okImage: "",
      okRatio: "16/9",
      okFit: "cover",
      okPosition: "center",
      okEffect: "blur",
      okRuntime: "off",
    });
    expect(img.getAttribute("loading")).toBe("lazy");
    expect(img.getAttribute("decoding")).toBe("async");
    const placeholder = root.querySelector(":scope > [data-ok-image-placeholder]");
    expect(placeholder?.getAttribute("aria-hidden")).toBe("true");
    expect(root.querySelector("[data-ok-image-overlay]")).toBeNull();
  });

  it("goes from loading to loaded and calls onLoad once", async () => {
    const onLoad = vi.fn();
    render(<Image src={`${PIXEL}#b`} alt="A tree" onLoad={onLoad} />);
    const root = rootOf(screen.getByRole("img", { name: "A tree" }));
    expect(root.dataset["okState"]).toBe("loading");
    await stateIs(root, "loaded");
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it("marks errors with an icon, keeps the alt, and loads again on a new src", async () => {
    const onError = vi.fn();
    const imgOnError = vi.fn();
    const { rerender } = render(
      <Image src={BROKEN} alt="Broken" onError={onError} imgProps={{ onError: imgOnError }} />,
    );
    const img = screen.getByRole("img", { name: "Broken" });
    const root = rootOf(img);
    await stateIs(root, "error");
    expect(onError).toHaveBeenCalledTimes(1);
    expect(imgOnError).toHaveBeenCalledTimes(1);
    const icon = root.querySelector(":scope > [data-ok-image-icon]");
    expect(icon?.getAttribute("aria-hidden")).toBe("true");
    expect(getComputedStyle(img).opacity).toBe("0");
    rerender(<Image src={`${OTHER}#c`} alt="Broken" onError={onError} />);
    expect(root.dataset["okState"]).toBe("loading");
    await stateIs(root, "loaded");
    expect(root.querySelector("[data-ok-image-icon]")).toBeNull();
  });

  it("writes every option value and drops invalid ones", () => {
    const { container, rerender } = render(<Image alt="" />);
    const root = container.firstElementChild as HTMLElement;
    for (const ratio of imageRatios) {
      rerender(<Image alt="" ratio={ratio} />);
      expect(root.dataset["okRatio"]).toBe(ratio);
    }
    for (const fit of imageFits) {
      rerender(<Image alt="" fit={fit} />);
      expect(root.dataset["okFit"]).toBe(fit);
    }
    for (const position of imagePositions) {
      rerender(<Image alt="" position={position} />);
      expect(root.dataset["okPosition"]).toBe(position);
    }
    for (const effect of imageEffects) {
      rerender(<Image alt="" effect={effect} />);
      expect(root.dataset["okEffect"]).toBe(effect);
    }
    rerender(
      <Image
        alt=""
        ratio={HOSTILE}
        fit={HOSTILE}
        position={HOSTILE}
        effect={HOSTILE}
        overlay={HOSTILE}
      />,
    );
    expect(root.dataset).toMatchObject({ okFit: "cover", okPosition: "center", okEffect: "blur" });
    expect(root.hasAttribute("data-ok-ratio")).toBe(false);
    expect(root.hasAttribute("data-ok-overlay")).toBe(false);
    expect(root.querySelector("[data-ok-image-overlay]")).toBeNull();
    expect(document.querySelectorAll("img")).toHaveLength(1);
  });

  it("takes any other ratio through a private property, next to the author's style", () => {
    const { container, rerender } = render(
      <Image src={PIXEL} alt="Wide" ratio="16/10" style={{ width: 160 }} />,
    );
    const root = container.firstElementChild as HTMLElement;
    const img = root.querySelector("img") as HTMLImageElement;
    expect(root.dataset["okRatio"]).toBe("16/10");
    expect(root.style.getPropertyValue("--_ok-image-ratio")).toBe("16 / 10");
    expect(root.style.width).toBe("160px");
    expect(getComputedStyle(img).position).toBe("static");
    expect(root.getBoundingClientRect().height).toBeCloseTo(100, 0);
    rerender(<Image src={PIXEL} alt="Wide" ratio={4} style={{ width: 160 }} />);
    expect(root.dataset["okRatio"]).toBe("4");
    expect(root.getBoundingClientRect().height).toBeCloseTo(40, 0);
    // A named ratio stays a CSS rule: no private property.
    rerender(<Image src={PIXEL} alt="Wide" ratio="16/9" />);
    expect(root.style.getPropertyValue("--_ok-image-ratio")).toBe("");
    expect(getComputedStyle(img).position).toBe("absolute");
    rerender(<Image src={PIXEL} alt="Wide" ratio="0/1" />);
    expect(root.hasAttribute("data-ok-ratio")).toBe(false);
  });

  it("renders the overlay and its gradient colors", () => {
    const { container } = render(
      <Image src={PIXEL} alt="City" overlay="info" overlayFrom="secondary" />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset).toMatchObject({ okOverlay: "info", okOverlayFrom: "secondary" });
    const overlay = root.querySelector(":scope > [data-ok-image-overlay]") as Element;
    expect(overlay.getAttribute("aria-hidden")).toBe("true");
    expect(getComputedStyle(overlay).backgroundImage).toContain("linear-gradient(to top");
  });

  it("visibleByDefault loads eagerly and shows at once", () => {
    render(<Image src={`${PIXEL}#d`} alt="Hero" visibleByDefault loading="lazy" />);
    const img = screen.getByRole("img", { name: "Hero" });
    expect(img.getAttribute("loading")).toBe("eager");
    expect(getComputedStyle(img).opacity).toBe("1");
    const placeholder = rootOf(img).querySelector("[data-ok-image-placeholder]") as Element;
    expect(getComputedStyle(placeholder).display).toBe("none");
  });

  it("passes native attributes, the placeholder preview and refs", () => {
    const ref = createRef<HTMLSpanElement>();
    const imgRef = createRef<HTMLImageElement>();
    render(
      <Image
        ref={ref}
        imgRef={imgRef}
        src={PIXEL}
        srcSet={`${PIXEL} 1x`}
        sizes="50vw"
        alt="Sized"
        width={800}
        height={600}
        loading="eager"
        decoding="sync"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        placeholderSrc={OTHER}
        className="card"
        imgProps={{ title: "Sized picture" }}
      />,
    );
    const img = screen.getByRole("img", { name: "Sized" });
    expect(imgRef.current).toBe(img);
    expect(ref.current).toBe(rootOf(img));
    expect(ref.current?.className).toBe("card");
    for (const [name, value] of [
      ["srcset", `${PIXEL} 1x`],
      ["sizes", "50vw"],
      ["width", "800"],
      ["height", "600"],
      ["loading", "eager"],
      ["decoding", "sync"],
      ["crossorigin", "anonymous"],
      ["referrerpolicy", "no-referrer"],
      ["title", "Sized picture"],
    ])
      expect(img.getAttribute(name as string)).toBe(value);
    const preview = ref.current?.querySelector("[data-ok-image-placeholder] > img");
    expect(preview?.getAttribute("src")).toBe(OTHER);
    expect(preview?.getAttribute("alt")).toBe("");
  });

  it("renders custom placeholder content", () => {
    const { container } = render(<Image alt="" placeholder={<b>Loading</b>} />);
    expect(container.querySelector("[data-ok-image-placeholder] > b")?.textContent).toBe("Loading");
  });

  it("works in StrictMode and has no axe violations", async () => {
    const { container } = render(
      <StrictMode>
        <Image src={`${PIXEL}#e`} alt="Strict" ratio="1/1" overlay="dark" />
        <Image src={BROKEN} alt="Also broken" ratio="4/3" />
        <Image src={`${PIXEL}#f`} alt="" />
      </StrictMode>,
    );
    const [first, second] = container.querySelectorAll("[data-ok-image]");
    await Promise.all([stateIs(first as Element, "loaded"), stateIs(second as Element, "error")]);
    await expectNoAxeViolations(container);
  });

  it("renders on the server and reads the settled image after hydration", async () => {
    const element = <Image src={`${PIXEL}#g`} alt="Server" ratio="3/2" />;
    const html = renderToString(element);
    expect(html).toContain('data-ok-state="loading"');
    expect(html).toContain('data-ok-image-placeholder=""');
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.append(host);
    const img = host.querySelector("img") as HTMLImageElement;
    if (!img.complete)
      await new Promise((resolve) => img.addEventListener("load", resolve, { once: true }));
    let root: ReturnType<typeof hydrateRoot> | undefined;
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    await act(async () => {
      root = hydrateRoot(host, element);
    });
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
    expect(host.querySelector("[data-ok-image]")?.getAttribute("data-ok-state")).toBe("loaded");
    act(() => root?.unmount());
    host.remove();
  });
});
