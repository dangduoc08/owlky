import { act, render, screen } from "@testing-library/react";
import { createRef, type ReactNode, type RefObject, StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Dialog } from "../dialog/dialog.js";
import { expectNoAxeViolations, finishExit } from "../test-utils.js";
import { Motion, MotionGroup, MotionText } from "./motion.js";
import { MotionPresence } from "./motion-presence.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;
const css = (element: Element) => getComputedStyle(element);
const byTestId = (id: string) => screen.getByTestId(id);

/** Resolves once `element` carries `data-ok-state="<state>"`. */
function stateBecomes(element: Element, state: string): Promise<void> {
  return new Promise((resolve) => {
    if (element.getAttribute("data-ok-state") === state) return resolve();
    const observer = new MutationObserver(() => {
      if (element.getAttribute("data-ok-state") !== state) return;
      observer.disconnect();
      resolve();
    });
    observer.observe(element, { attributes: true, attributeFilter: ["data-ok-state"] });
  });
}

/** Ends the element's animations (their end state is what the tests check). */
const finish = (element: Element) => {
  for (const animation of element.getAnimations()) animation.finish();
};

describe("Motion", () => {
  it("renders the anatomy; mount enters right away", () => {
    render(
      <Motion data-testid="m" variant="fadeInUp" trigger="mount">
        Hello
      </Motion>,
    );
    const element = byTestId("m");
    expect(element.getAttribute("data-ok-motion")).toBe("");
    expect(element.getAttribute("data-ok-variant")).toBe("fadeInUp");
    expect(element.getAttribute("data-ok-trigger")).toBe("mount");
    expect(element.getAttribute("data-ok-runtime")).toBe("off");
    expect(element.getAttribute("data-ok-state")).toBe("enter");
    expect(css(element).animationName).toBe("ok-motion");
    expect(css(element).animationPlayState).toBe("running");
    expect(css(element).animationDuration).toBe("0.64s");
  });

  it("initial: in-variants start hidden and displaced, out-variants as themselves", () => {
    render(
      <>
        <Motion data-testid="in" variant="fadeInUp" trigger="manual" in={false}>
          In
        </Motion>
        <Motion data-testid="out" variant="fadeOutUp" trigger="manual" in={false}>
          Out
        </Motion>
        <Motion data-testid="plain" variant="fadeIn" trigger="mount">
          Plain
        </Motion>
      </>,
    );
    const shown = byTestId("in");
    expect(shown.getAttribute("data-ok-state")).toBe("initial");
    expect(shown.hasAttribute("data-ok-in")).toBe(false);
    expect(css(shown).opacity).toBe("0");
    expect(css(shown).animationPlayState).toBe("paused");
    expect(css(byTestId("out")).opacity).toBe("1");
    // fadeInUp starts 120px below its place (default fade distance).
    expect(new DOMMatrix(css(shown).transform).m42).toBe(120);
    expect(css(byTestId("out")).transform).toBe("none");
  });

  it("manual: in plays the entrance, turning it off plays the exit backwards", () => {
    const { rerender } = render(
      <Motion data-testid="m" variant="zoomIn" trigger="manual" in={false}>
        Box
      </Motion>,
    );
    const element = byTestId("m");
    rerender(
      <Motion data-testid="m" variant="zoomIn" trigger="manual" in>
        Box
      </Motion>,
    );
    expect(element.getAttribute("data-ok-state")).toBe("enter");
    expect(element.hasAttribute("data-ok-in")).toBe(true);
    finish(element);
    expect(css(element).opacity).toBe("1");
    // The entrance leaves no transform behind.
    expect(css(element).transform).toBe("none");
    rerender(
      <Motion data-testid="m" variant="zoomIn" trigger="manual" in={false}>
        Box
      </Motion>,
    );
    expect(element.getAttribute("data-ok-state")).toBe("exit");
    expect(css(element).animationName).toBe("ok-motion-exit");
    expect(css(element).animationDirection).toBe("reverse");
    expect(css(element).animationDuration).toBe("0.48s");
    finish(element);
    expect(css(element).opacity).toBe("0");
  });

  it("out-variants play backwards on entrance and end hidden", () => {
    render(
      <Motion data-testid="m" variant="fadeOutLeft" trigger="mount">
        Bye
      </Motion>,
    );
    const element = byTestId("m");
    expect(css(element).animationDirection).toBe("reverse");
    finish(element);
    expect(css(element).opacity).toBe("0");
  });

  it("in view (default): enters once the element is visible", async () => {
    render(<Motion data-testid="m">Seen</Motion>);
    const element = byTestId("m");
    expect(element.getAttribute("data-ok-trigger")).toBe("inView");
    await stateBecomes(element, "enter");
    expect(element.getAttribute("data-ok-state")).toBe("enter");
  });

  it("duration, delay and distance tune the animation; invalid values are dropped", () => {
    render(
      <>
        <Motion
          data-testid="m"
          variant="slideInLeft"
          trigger="manual"
          in={false}
          duration={800}
          delay={100}
          distance={40}
        >
          Tuned
        </Motion>
        <Motion
          data-testid="bad"
          variant={HOSTILE}
          trigger={HOSTILE}
          amount={-1}
          duration={-5}
          delay={Number.NaN}
          distance={Number.POSITIVE_INFINITY}
        >
          Bad
        </Motion>
      </>,
    );
    const element = byTestId("m");
    expect(css(element).animationDuration).toBe("0.8s");
    expect(css(element).animationDelay).toBe("0.1s");
    expect(element.getAttribute("data-ok-distance")).toBe("40");
    // slideInLeft starts 40px to the left.
    expect(new DOMMatrix(css(element).transform).m41).toBe(-40);
    const bad = byTestId("bad");
    expect(bad.getAttribute("data-ok-variant")).toBe("fadeIn");
    expect(bad.getAttribute("data-ok-trigger")).toBe("inView");
    expect(bad.hasAttribute("data-ok-amount")).toBe(false);
    expect(bad.hasAttribute("data-ok-duration")).toBe(false);
    expect(bad.getAttribute("style") ?? "").not.toContain("--_ok-motion");
  });

  it("paused stops the animation; loops run while entered", () => {
    render(
      <>
        <Motion data-testid="loop" variant="kenburnsTop" trigger="mount">
          Image
        </Motion>
        <Motion data-testid="paused" variant="panLeft" trigger="mount" paused>
          Gradient
        </Motion>
        <Motion data-testid="color" variant="color3x" trigger="manual" in={false}>
          Text
        </Motion>
      </>,
    );
    const loop = byTestId("loop");
    expect(css(loop).animationName).toBe("ok-motion-kenburns");
    expect(css(loop).animationIterationCount).toBe("infinite");
    expect(css(loop).animationPlayState).toBe("running");
    expect(css(loop).transformOrigin).toMatch(/^\S+ 0px$/);
    const paused = byTestId("paused");
    expect(paused.hasAttribute("data-ok-paused")).toBe(true);
    expect(css(paused).animationName).toBe("ok-motion-pan");
    expect(css(paused).animationPlayState).toBe("paused");
    const color = byTestId("color");
    expect(css(color).animationPlayState).toBe("paused");
    expect(css(color).color).toBe("rgba(0, 0, 0, 0)");
    expect(css(color).backgroundSize).toBe("300% auto");
  });

  it("bounce and flip use their own keyframes and axes", () => {
    render(
      <>
        <Motion data-testid="bounce" variant="bounceInDown" trigger="mount">
          B
        </Motion>
        <Motion data-testid="flip" variant="flipOutY" trigger="mount">
          F
        </Motion>
      </>,
    );
    expect(css(byTestId("bounce")).animationName).toBe("ok-motion-bounce");
    expect(css(byTestId("flip")).animationName).toBe("ok-motion-flip");
    expect(css(byTestId("flip")).animationDirection).toBe("reverse");
  });

  it("draw traces the strokes; interactive has no entrance", () => {
    render(
      <>
        <Motion data-testid="draw" variant="draw" trigger="mount">
          <svg viewBox="0 0 10 10" aria-hidden="true">
            <path pathLength={1} d="M0 0 L10 10" stroke="black" />
          </svg>
        </Motion>
        <Motion data-testid="tap" variant="interactive">
          <button type="button">Tap</button>
        </Motion>
      </>,
    );
    const draw = byTestId("draw");
    expect(css(draw).animationName).toBe("none");
    const path = draw.querySelector("path") as SVGPathElement;
    expect(css(path).animationName).toBe("ok-motion-draw");
    expect(css(path).strokeDasharray).toBe("1px");
    const tap = byTestId("tap");
    expect(css(tap).animationName).toBe("none");
    expect(css(tap).transitionProperty).toBe("transform");
  });

  it("forwards ref, props and animation events", () => {
    const ref = createRef<HTMLDivElement>();
    const onAnimationEnd = vi.fn();
    render(
      <Motion
        ref={ref}
        className="x"
        style={{ color: "red" }}
        trigger="mount"
        onAnimationEnd={onAnimationEnd}
      >
        Content
      </Motion>,
    );
    expect(ref.current?.className).toBe("x");
    expect(ref.current?.style.color).toBe("red");
    act(() => finish(ref.current as HTMLElement));
    act(() => {
      ref.current?.dispatchEvent(new AnimationEvent("animationend", { bubbles: true }));
    });
    expect(onAnimationEnd).toHaveBeenCalled();
  });

  it("a new variant replays an entered Motion; one that never entered waits", () => {
    const { rerender } = render(
      <>
        <Motion data-testid="m" variant="fadeIn" trigger="mount">
          A
        </Motion>
        <Motion data-testid="w" variant="fadeIn" trigger="manual" in={false}>
          B
        </Motion>
      </>,
    );
    const element = byTestId("m");
    finish(element);
    const before = element.getAnimations()[0];
    rerender(
      <>
        <Motion data-testid="m" variant="zoomIn" trigger="mount">
          A
        </Motion>
        <Motion data-testid="w" variant="zoomIn" trigger="manual" in={false}>
          B
        </Motion>
      </>,
    );
    expect(element.getAttribute("data-ok-state")).toBe("enter");
    expect(element.getAnimations()[0]).not.toBe(before);
    expect(element.getAnimations()[0]?.playState).toBe("running");
    expect(byTestId("w").getAttribute("data-ok-state")).toBe("initial");
  });

  it("SSR renders the initial state; StrictMode keeps one trigger", () => {
    const html = renderToString(<Motion variant="fadeIn">Server</Motion>);
    expect(html).toContain('data-ok-state="initial"');
    render(
      <StrictMode>
        <Motion data-testid="m" trigger="manual" in={false}>
          Strict
        </Motion>
      </StrictMode>,
    );
    expect(byTestId("m").getAttribute("data-ok-state")).toBe("initial");
  });

  it("no axe violations", async () => {
    render(
      <Motion trigger="mount">
        <p>Animated paragraph</p>
      </Motion>,
    );
    await expectNoAxeViolations();
  });
});

describe("MotionGroup", () => {
  it("drives its Motions and staggers direct children", () => {
    const { rerender } = render(
      <MotionGroup data-testid="g" trigger="manual" in={false} stagger={80}>
        <Motion data-testid="a" variant="fadeInUp">
          A
        </Motion>
        <Motion data-testid="b" variant="fadeInUp" style={{ color: "red" }}>
          B
        </Motion>
        text
      </MotionGroup>,
    );
    const group = byTestId("g");
    expect(group.getAttribute("data-ok-motion-group")).toBe("");
    expect(group.getAttribute("data-ok-stagger")).toBe("80");
    expect(byTestId("a").getAttribute("data-ok-state")).toBe("initial");
    expect(css(byTestId("b")).animationDelay).toBe("0.08s");
    expect(byTestId("b").style.color).toBe("red");
    rerender(
      <MotionGroup data-testid="g" trigger="manual" in stagger={80}>
        <Motion data-testid="a" variant="fadeInUp">
          A
        </Motion>
        <Motion data-testid="b" variant="fadeInUp" style={{ color: "red" }}>
          B
        </Motion>
        text
      </MotionGroup>,
    );
    expect(group.getAttribute("data-ok-state")).toBe("enter");
    expect(byTestId("a").getAttribute("data-ok-state")).toBe("enter");
    expect(byTestId("b").getAttribute("data-ok-state")).toBe("enter");
    expect(group.hasAttribute("data-ok-in")).toBe(true);
  });

  it("default stagger is 50ms; invalid stagger falls back", () => {
    render(
      <MotionGroup trigger="mount" stagger={-1} delay={20}>
        <Motion data-testid="a">A</Motion>
        <Motion data-testid="b">B</Motion>
      </MotionGroup>,
    );
    expect(css(byTestId("b")).animationDelay).toBe("0.07s");
  });
});

describe("MotionText", () => {
  it("letters animate one by one; the text is read whole", async () => {
    render(
      <h2>
        <MotionText
          data-testid="t"
          variant="fadeInUp"
          trigger="mount"
          stagger={40}
          duration={500}
          delay={10}
          distance={20}
        >
          {"Hi  you"}
        </MotionText>
      </h2>,
    );
    const text = byTestId("t");
    expect(screen.getByRole("heading").textContent).toContain("Hi  you");
    expect(screen.getByRole("heading", { name: "Hi you" })).toBeTruthy();
    const chars = [...text.querySelectorAll("[data-ok-motion-char]")];
    expect(chars.map((c) => c.textContent).join("")).toBe("Hiyou");
    expect(text.querySelectorAll("[data-ok-motion-text-word]")).toHaveLength(2);
    expect(css(chars[2] as Element).animationDelay).toBe("0.09s");
    expect(css(chars[0] as Element).animationDuration).toBe("0.5s");
    expect(css(chars[0] as Element).animationPlayState).toBe("running");
    expect(css(text.querySelector("[data-ok-motion-text-label]") as Element).position).toBe(
      "absolute",
    );
    await expectNoAxeViolations();
  });

  it("default stagger is 25ms; manual exit", () => {
    const { rerender } = render(
      <MotionText data-testid="t" trigger="manual">
        Ab
      </MotionText>,
    );
    const second = byTestId("t").querySelectorAll("[data-ok-motion-char]")[1] as Element;
    expect(css(second).animationDelay).toBe("0.025s");
    rerender(
      <MotionText data-testid="t" trigger="manual" in={false}>
        Ab
      </MotionText>,
    );
    expect(css(second).animationName).toBe("ok-motion-exit");
  });
});

/** A 100px scroller whose first child is `content`, followed by 1000px of space. */
function Scroller({
  scroller,
  children,
}: {
  scroller: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}) {
  return (
    <div ref={scroller} data-testid="scroller" style={{ height: 100, overflow: "auto" }}>
      {children}
      <div style={{ height: 1000 }} />
    </div>
  );
}

/** Resolves on the next call of a viewport handler. */
const called = () => {
  let resolve: (entry: IntersectionObserverEntry) => void = () => {};
  const promise = new Promise<IntersectionObserverEntry>((done) => {
    resolve = done;
  });
  return { promise, handler: (entry: IntersectionObserverEntry) => resolve(entry) };
};

describe("component and viewport", () => {
  it("component picks the element of every root; the ref points at it", () => {
    const ref = createRef<HTMLElement>();
    render(
      <>
        <Motion ref={ref} component="section" data-testid="m" trigger="mount">
          Section
        </Motion>
        <MotionGroup component="ul" data-testid="g" trigger="mount">
          <Motion component="li">Item</Motion>
        </MotionGroup>
        <MotionText component="h2" data-testid="t" trigger="mount">
          Title
        </MotionText>
      </>,
    );
    expect(byTestId("m").tagName).toBe("SECTION");
    expect(ref.current).toBe(byTestId("m"));
    expect(byTestId("g").tagName).toBe("UL");
    expect(byTestId("g").firstElementChild?.tagName).toBe("LI");
    expect(byTestId("g").firstElementChild?.getAttribute("data-ok-state")).toBe("enter");
    expect(screen.getByRole("heading", { level: 2, name: "Title" })).toBe(byTestId("t"));
    expect(screen.getByRole("list")).toBe(byTestId("g"));
  });

  it("viewportMargin is written like the HTML markup; empty margins are dropped", () => {
    render(
      <>
        <Motion data-testid="m" viewportMargin=" 0px 0px -100px ">
          A
        </Motion>
        <MotionGroup data-testid="g" viewportMargin="">
          <Motion>B</Motion>
        </MotionGroup>
        <MotionText data-testid="t" viewportMargin="10%">
          C
        </MotionText>
      </>,
    );
    expect(byTestId("m").getAttribute("data-ok-viewport-margin")).toBe("0px 0px -100px");
    expect(byTestId("g").hasAttribute("data-ok-viewport-margin")).toBe(false);
    expect(byTestId("t").getAttribute("data-ok-viewport-margin")).toBe("10%");
  });

  it("viewport events: enter and leave a scrolling root", async () => {
    const scroller = createRef<HTMLDivElement>();
    const enter = called();
    const leave = called();
    render(
      <Scroller scroller={scroller}>
        <Motion
          data-testid="m"
          once={false}
          amount={0}
          viewportRoot={scroller}
          onViewportEnter={enter.handler}
          onViewportLeave={leave.handler}
          style={{ height: 40 }}
        >
          Box
        </Motion>
      </Scroller>,
    );
    const entered = await enter.promise;
    expect(entered.isIntersecting).toBe(true);
    expect(entered.rootBounds?.height).toBe(100);
    (scroller.current as HTMLDivElement).scrollTop = 600;
    const left = await leave.promise;
    expect(left.isIntersecting).toBe(false);
    await stateBecomes(byTestId("m"), "exit");
  });

  it("a negative margin keeps an element at the edge out of view", async () => {
    const scroller = createRef<HTMLDivElement>();
    const enter = called();
    const onViewportEnter = vi.fn(enter.handler);
    render(
      <Scroller scroller={scroller}>
        <MotionGroup
          data-testid="g"
          amount={0}
          viewportRoot={scroller}
          viewportMargin="0px 0px -80px"
          onViewportEnter={onViewportEnter}
          style={{ marginTop: 60 }}
        >
          <Motion style={{ height: 10 }}>Late</Motion>
        </MotionGroup>
      </Scroller>,
    );
    const group = byTestId("g");
    // The group (60px down) lies below the shrunk viewport (its top 20px).
    await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 100)));
    expect(onViewportEnter).not.toHaveBeenCalled();
    expect(group.getAttribute("data-ok-state")).toBe("initial");
    (scroller.current as HTMLDivElement).scrollTop = 60;
    await enter.promise;
    await stateBecomes(group, "enter");
  });

  it("MotionText reports the viewport too", async () => {
    const enter = called();
    render(<MotionText onViewportEnter={enter.handler}>Seen</MotionText>);
    expect((await enter.promise).isIntersecting).toBe(true);
  });
});

describe("Dialog transition", () => {
  it("the paper plays the Motion entrance; without it, the default fade", () => {
    const { rerender } = render(
      <Dialog open aria-label="Animated" transition="slideInUp">
        Hello
      </Dialog>,
    );
    const paper = document.querySelector("[data-ok-dialog-paper]") as HTMLElement;
    expect(paper.getAttribute("data-ok-motion")).toBe("");
    expect(paper.getAttribute("data-ok-variant")).toBe("slideInUp");
    expect(paper.getAttribute("data-ok-state")).toBe("enter");
    expect(css(paper).animationName).toBe("ok-motion");
    rerender(
      <Dialog open aria-label="Animated">
        Hello
      </Dialog>,
    );
    expect(paper.hasAttribute("data-ok-motion")).toBe(false);
    expect(css(paper).animationName).toBe("ok-dialog-in");
  });
});

describe("Motion keyframes (ADR-0062)", () => {
  it("writes the keyframes as JSON and plays them on entrance", async () => {
    render(
      <Motion
        data-testid="k"
        trigger="mount"
        keyframes={{ rotate: [0, 270], borderRadius: ["25%", "50%"] }}
        transition={{ duration: 3200, ease: "linear", repeat: Infinity }}
      />,
    );
    const element = byTestId("k");
    expect(element.getAttribute("data-ok-keyframes")).toBe(
      '{"rotate":[0,270],"borderRadius":["25%","50%"]}',
    );
    expect(element.getAttribute("data-ok-transition")).toBe(
      '{"duration":3200,"repeat":"Infinity","ease":"linear"}',
    );
    await stateBecomes(element, "enter");
    await act(async () => {
      await new Promise<void>((resolve) => setTimeout(resolve));
    });
    expect(css(element).animationName).toBe("none");
    const animations = element.getAnimations();
    expect(animations).toHaveLength(2);
    expect(animations[0]?.effect?.getTiming().iterations).toBe(Infinity);
  });

  it("server markup carries the attributes and no player", () => {
    const html = renderToString(<Motion keyframes={{ opacity: [0, 1] }} />);
    expect(html).toContain("data-ok-keyframes");
    expect(renderToString(<Motion keyframes={{ "bad key": 1 } as never} />)).not.toContain(
      "data-ok-keyframes",
    );
  });
});

function List({ initial, onExitComplete }: { initial?: boolean; onExitComplete?: () => void }) {
  const [items, setItems] = useState(["a", "b"]);
  return (
    <>
      <button type="button" onClick={() => setItems((list) => list.slice(1))}>
        Remove
      </button>
      <button type="button" onClick={() => setItems([])}>
        Clear
      </button>
      <button type="button" onClick={() => setItems((list) => ["a", ...list])}>
        Add
      </button>
      <MotionPresence initial={initial} onExitComplete={onExitComplete}>
        {items.map((item) => (
          <Motion key={item} data-testid={item} trigger="mount" variant="fadeIn">
            {item}
          </Motion>
        ))}
      </MotionPresence>
    </>
  );
}

function Swap({ done }: { done: () => void }) {
  const [key, setKey] = useState("one");
  return (
    <>
      <button type="button" onClick={() => setKey("two")}>
        Swap
      </button>
      <MotionPresence mode="wait" onExitComplete={done}>
        <Motion key={key} data-testid={key} trigger="mount">
          {key}
        </Motion>
      </MotionPresence>
    </>
  );
}

function Plain() {
  const [shown, setShown] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setShown(false)}>
        Hide
      </button>
      <MotionPresence>{shown ? <p key="p">Plain</p> : null}</MotionPresence>
    </>
  );
}

function Group({ initial }: { initial?: boolean }) {
  const [shown, setShown] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setShown(false)}>
        Hide
      </button>
      <MotionPresence initial={initial}>
        {shown ? (
          <MotionGroup key="g" data-testid="g" trigger="mount">
            <Motion data-testid="g1">One</Motion>
            <MotionText data-testid="t" trigger="mount">
              Hi
            </MotionText>
          </MotionGroup>
        ) : null}
      </MotionPresence>
    </>
  );
}

describe("MotionPresence", () => {
  it("keeps a removed child until its exit has played", async () => {
    render(<List />);
    const a = byTestId("a");
    await act(async () => screen.getByRole("button", { name: "Remove" }).click());
    expect(a.isConnected).toBe(true);
    expect(a.getAttribute("data-ok-state")).toBe("exit");
    expect(css(a).animationName).toBe("ok-motion-exit");
    await finishExit(a);
    expect(a.isConnected).toBe(false);
    expect(byTestId("b").getAttribute("data-ok-state")).toBe("enter");
  });

  it("brings a child back when it returns during its exit", async () => {
    render(<List />);
    const a = byTestId("a");
    await act(async () => screen.getByRole("button", { name: "Remove" }).click());
    await act(async () => screen.getByRole("button", { name: "Add" }).click());
    await finishExit(a);
    expect(a.isConnected).toBe(true);
    expect(a.getAttribute("data-ok-state")).toBe("enter");
  });

  it("initial={false} skips the first entrance", () => {
    render(<List initial={false} />);
    expect(byTestId("a").hasAttribute("data-ok-state")).toBe(false);
  });

  it("mode wait renders the new child after the old one left; onExitComplete", async () => {
    const done = vi.fn();
    render(<Swap done={done} />);
    const one = byTestId("one");
    await act(async () => screen.getByRole("button", { name: "Swap" }).click());
    expect(screen.queryByTestId("two")).toBeNull();
    await finishExit(one);
    expect(one.isConnected).toBe(false);
    expect(byTestId("two")).toBeTruthy();
    expect(done).toHaveBeenCalledOnce();
  });

  it("removes children without Motions at once", async () => {
    render(<Plain />);
    await act(async () => screen.getByRole("button", { name: "Hide" }).click());
    expect(screen.queryByText("Plain")).toBeNull();
  });

  it("a MotionGroup and a MotionText exit too", async () => {
    render(<Group />);
    const group = byTestId("g");
    await act(async () => screen.getByRole("button", { name: "Hide" }).click());
    expect(byTestId("g1").getAttribute("data-ok-state")).toBe("exit");
    expect(byTestId("t").getAttribute("data-ok-state")).toBe("exit");
    await finishExit(group);
    expect(group.isConnected).toBe(false);
  });

  it("initial={false} also skips a group's and a text's first entrance", () => {
    render(<Group initial={false} />);
    expect(byTestId("g").hasAttribute("data-ok-state")).toBe(false);
    expect(byTestId("t").hasAttribute("data-ok-state")).toBe(false);
  });

  it("onExitComplete waits for every removed child", async () => {
    const done = vi.fn();
    render(<List onExitComplete={done} />);
    const [a, b] = [byTestId("a"), byTestId("b")];
    await act(async () => screen.getByRole("button", { name: "Clear" }).click());
    await finishExit(a);
    expect(a.isConnected).toBe(false);
    expect(b.isConnected).toBe(true);
    expect(done).not.toHaveBeenCalled();
    await finishExit(b);
    expect(done).toHaveBeenCalledOnce();
  });
});

describe("manual trigger without in", () => {
  it("Motion and MotionGroup count as shown", () => {
    render(
      <>
        <Motion data-testid="m" trigger="manual" />
        <MotionGroup data-testid="g" trigger="manual" />
      </>,
    );
    expect(byTestId("m").hasAttribute("data-ok-in")).toBe(true);
    expect(byTestId("g").hasAttribute("data-ok-in")).toBe(true);
  });
});
