# ADR-0062: Motion full version — a Web Animations API engine in core, exits before removal

**Status:** Accepted (2026-11-11). Supersedes the "CSS keyframes only" playback of the Motion beta
(`docs/roadmap.md` → Motion, 2026-11-08) for custom keyframes; the named variants keep their CSS.

## Context
The Motion beta plays the reference's named variants with CSS keyframes driven by custom
properties, and core only decides *when* (`createMotionTrigger`). That covers entrances, exits,
loops, `draw` and `interactive`, but not what Framer Motion / Motion One (MIT, the API references,
ADR-0015) are mostly used for: arbitrary keyframes (`animate={{ rotate: [0, 270] }}`), springs,
interruption that starts from where the element is, and exits that run before an element leaves
the DOM (`AnimatePresence`). Three waits depend on it: the Motion "Logo" story (the reference's
shape-morphing rings, the last "Pending integrations" row), Dialog exit transitions (4.8 left
them to Phase 5) and Dialog `transitionDuration` (4.18.44). Phase 5 of
`docs/roadmap-components.md` lists four steps: 5.1 engine, 5.2 scroll, 5.3 gestures, 5.4 layout.

Constraints: no new runtime dependency (AGENTS.md rule 7), one core for React and HTML, nothing
hidden without JavaScript, reduced motion honored, timings from `--ok-*` tokens, strict CSP (no
`style` attributes in snippets; CSSOM writes are fine), Baseline Chrome / Edge 114, Firefox 128,
Safari 17 (ADR-0006). `linear()` easing is in Chrome 113, Firefox 112 and Safari 17.2, so Safari
17.0 / 17.1 need a fallback. Individual transform properties (`translate`, `scale`, `rotate`),
`Element.animate`, `Animation.commitStyles` and `getAnimations()` are in the whole Baseline.

## Decision

### Architecture for 5.1–5.4
- **One engine in core, on the Web Animations API.** `animate()` is the only code that starts
  script animations; later phases feed it (5.2 scroll timelines, 5.3 gesture springs, 5.4 FLIP
  transforms). Named variants stay CSS (byte-identical snippets, no JavaScript needed).
- **Owners stay owners.** As in ADR-0004, React and the HTML runtime own state and markup; core
  functions take an element and report through promises and callbacks.
- **5.2 Scroll:** `animation-timeline: scroll() / view()` where supported, a scroll listener that
  sets `currentTime` on the engine's paused animations elsewhere (Firefox).
- **5.3 Gestures:** Pointer Events (as Slider and Sortable); release velocity feeds the spring
  generator below (`velocity`), constraints clamp the target.
  *Note 2026-11-11 (5.3 built):* the glide after a release isn't a `springEasing` curve: each
  axis needs a decay that turns into a spring where it crosses a constraint (Framer's inertia),
  which no single easing describes. `inertiaPath` simulates each axis (1 ms steps) and `animate()`
  plays the result as `translate` keyframes every 1/60 s with linear easing, so interruption,
  the committed end and reduced motion still go through the engine. Hover / tap / focus / drag
  states use `animate()` with springs as sketched. The swipe helper (`createSwipe`) shares the
  pan layer (`trackPan`), not the element movement.
- **5.4 Layout:** measure before and after, play the inverse transform with `animate()`; shared
  values are a small store with React hooks and HTML callbacks.

### 5.1 in detail
1. **`animate(target, keyframes, options) → AnimationControls`** (`@owlky/core`, re-exported by
   `@owlky/react` and `@owlky/html`). `target` is an element or a list of them. `keyframes` is
   Framer's object form (`{ opacity: [0, 1], x: 100 }`: a value or an array per property) or a
   Web Animations keyframe array. Shorthands map to the individual transform properties, so they
   never fight over `transform`: `x` / `y` → `translate` (numbers are px), `scale` / `scaleX` /
   `scaleY` → `scale`, `rotate` → `rotate` (numbers are deg). Other properties pass through
   (numbers get no unit, except lengths in a small px list such as `width` or `borderRadius`).
   Options follow Framer's `transition`, in milliseconds like the rest of Owlky (renamed from
   seconds): `duration` (default `--ok-duration-standard`), `delay`, `ease` (a CSS easing, a
   cubic-bezier array or a token name such as `"decelerate"`, default `--ok-easing-standard`),
   `times`, `repeat` (`Infinity` loops), `repeatType` (`loop` · `reverse` · `mirror`),
   `repeatDelay`, `type: "spring"` with `stiffness`, `damping`, `mass`, `velocity` or
   `visualDuration` / `duration` + `bounce`, and `reducedMotion` (`user` · `always` · `never`).
   Token defaults are read from the computed style of the document element, so a theme's
   durations apply.
2. **Springs become `linear()` easing.** `springEasing(options)` solves the damped spring
   (under-, critically and over-damped closed forms) from 0 to 1, stops when it rests (value and
   speed under thresholds, at most 10 s) and samples it into a `linear(…)` string plus the
   duration. Without `linear()` support (`CSS.supports`), a spring with a bounce gets an
   overshooting cubic-bezier and one without gets `--ok-easing-decelerate`, with the same
   duration: the end state and timing match, only the wobble is lost.
3. **Interruption from the current value.** The engine remembers its running animation per
   element and property (module-scoped `WeakMap`). A new animation of a property first reads the
   computed value (mid-flight), cancels the old one and starts from that value when the new
   keyframes give only a target. A single target value always starts from the current computed
   value (Framer's behavior).
4. **The end state stays.** When an animation finishes, the engine commits the final values to
   the element's inline style through CSSOM (`commitStyles()`) and cancels it, so nothing keeps
   a `fill: forwards` animation alive. Loops (`repeat: Infinity`) never commit.
5. **Controls.** `{ finished: Promise<void>, cancel(), stop(), complete(), pause(), play(),
   readonly animations }`: `cancel` drops the animation (the element goes back to its own style),
   `stop` keeps the current value, `complete` jumps to the end. `finished` resolves on the end
   and on `stop` / `complete`, and never rejects (a cancel resolves it too), so owners can always
   await it.
6. **Reduced motion.** With `reducedMotion: "user"` (the default) and
   `prefers-reduced-motion: reduce`, an animation jumps to its end state (duration 0); a loop
   doesn't start. `always` / `never` force either behavior.
7. **Declarative keyframes on Motion.** `Motion` takes `keyframes` and `transition` (React props;
   HTML `data-ok-keyframes` and `data-ok-transition`, JSON). They aren't schema options (free
   JSON, like `viewportMargin`); React writes the same attributes, so the markup stays equal. With
   keyframes the CSS variant doesn't play (`[data-ok-keyframes]` turns it off); the trigger's
   `enter` plays the keyframes with `animate()`, `exit` plays them backwards, `paused` pauses
   them. JSON can't hold `Infinity`: `"repeat": "Infinity"` is accepted. Renamed from Framer's
   `animate` object (Owlky's named form is `variant`; `data-ok-animate` is the IconButton hover
   flag).
8. **Exit before removal.** Core `playExit(element)` writes the exit state and resolves once the
   animations it started have finished: a Motion gets `data-ok-state="exit"` (its CSS exit, or
   its keyframes backwards), any other element `data-ok-state="exiting"` for its own CSS. It
   waits for `getAnimations({ subtree: true })` (finite ones only) with a safety timeout, and
   returns `{ finished: Promise<boolean>, cancel() }` (`false` when cancelled; `cancel` restores
   the previous state). React: `MotionPresence` (Framer's `AnimatePresence`, renamed) keeps a
   removed child rendered until its exit ends, `initial={false}` skips the first entrance. HTML:
   motion instances get `exit()`, `hide()` (exit, then `hidden`) and `remove()` (exit, then
   removal), each returning a promise.
9. **Dialog and Drawer exits through the modal controller.** `createModalController` gets
   `close(): Promise<boolean>`. It marks the dialog `data-ok-state="exiting"` (and plays a Motion
   paper's exit), waits like `playExit`, then calls `dialog.close()`, cleans up and restores focus.
   During the exit the dialog is still modal (focus trapped, page inert), `isOpen` is already
   `false` and `isClosing` `true`; Escape and backdrop clicks are ignored; `open()` cancels the
   exit and keeps the dialog open without moving the focus; `destroy()` ends it at once. Owners emit their
   close event after the promise (HTML `ok:dialog:close` / `ok:drawer:close` after focus has
   returned; React keeps `keepMounted={false}` children until then). Option `exit: false` closes
   at once. CSS: the Dialog paper fades and scales out, the Drawer paper slides back to its edge,
   both fade the `::backdrop`; reduced motion makes the exits instant (no animation → the close
   is synchronous).
10. **Dialog `transitionDuration` (4.18.44).** A number or `{ enter, exit }` in ms (MUI). HTML
    `data-ok-transition-duration` and `data-ok-transition-duration-exit` (as Collapse's
    `timeout`); core `dialogStyle()` writes `--_ok-dialog-enter` / `--_ok-dialog-exit` (React
    `style`, HTML CSSOM). A Motion paper reads them through `--_ok-motion-duration` /
    `--_ok-motion-exit-duration`. Drawer keeps its 4.9 number, now also used by its exit.
    Backdrop doesn't use the modal controller (its fades are CSS transitions in both directions
    already): unchanged.

## Consequences
- `ok:dialog:close` and `ok:drawer:close` now fire after the exit animation (about 200 ms), not
  synchronously: a release-note behavior change. With reduced motion, `exit: false` or no
  animation they stay synchronous. Code that awaited nothing and checked `dialog.open` right after
  `close()` must await the instance's close or the event.
- Inline styles written by `commitStyles()` stay after an animation: authors who animate a
  property and later restyle it with classes must clear it (or animate back).
- The spring fallback on Safari 17.0 / 17.1 has no overshoot.
- Bundle: the engine adds a few kB to `owlky.js` (measured in the review); declarative keyframes
  are parsed only when `data-ok-keyframes` is present.
- 5.2–5.4 reuse `animate()`; their details get their own sections or ADRs when they are built.

## Note 2026-11-11 — 5.2 Scroll as built
The sketch's native path is kept for the page only: the stylesheet animates
`--_ok-scroll-progress` with `animation-timeline: scroll(root)` (no JavaScript). A container or a
target doesn't use CSS named timelines (they need `scroll-timeline` / `view-timeline` and
`timeline-scope` written on the author's container, target and a common ancestor): core
`createScrollProgress` gives the engine's `animate()` a `ScrollTimeline` / `ViewTimeline` (the
script form of the same native timelines; `rangeStart` / `rangeEnd` for named offsets). So
`animate()` gained `timeline`, `rangeStart` and `rangeEnd`; an animation on a timeline is never
committed (like a loop) and ignores reduced motion (it shows a position). The fallback is as
sketched (a paused `animate()` whose `currentTime` a passive, rAF-throttled scroll listener sets),
also used for offsets no timeline range expresses exactly. `runningAnimations` (exits) and the
test helpers skip paused and scroll-driven animations, which end only when something scrolls.
Spec: `specs/components/scroll-progress.md`.
