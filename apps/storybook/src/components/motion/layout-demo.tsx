import { Button, Card, Motion, Paper, Typography } from "@owlky/react";
import { useState } from "react";

/**
 * Layout animations (roadmap 5.4): Motions with `layout` slide to their new place when the list
 * changes, `layoutId` hands a highlight from one button to the next. `initial={false}` skips the
 * entrance (they are already on the page). `.sb-layout-*` classes are story-only layout.
 */
const TASKS = ["Write the brief", "Review the design", "Ship the release", "Celebrate"];
const SPRING = { type: "spring", bounce: 0.2, duration: 400 } as const;

const slug = (text: string) => text.toLowerCase().replaceAll(" ", "-");

/** Reorder: each task moves up (the first one to the end); the moved button keeps the focus. */
export function LayoutReorderDemo() {
  const [order, setOrder] = useState(TASKS);
  const moveUp = (task: string) =>
    setOrder((current) => {
      const index = current.indexOf(task);
      const next = current.filter((item) => item !== task);
      next.splice(index === 0 ? next.length : index - 1, 0, task);
      return next;
    });
  return (
    <ul className="sb-layout-list" aria-label="Tasks">
      {order.map((task) => (
        <Motion
          key={task}
          component="li"
          className="sb-layout-item"
          layout
          initial={false}
          transition={SPRING}
        >
          <Card className="sb-layout-row">
            <Typography id={`layout-task-${slug(task)}`} variant="subtitle2">
              {task}
            </Typography>
            <Button
              color="inherit"
              size="sm"
              aria-describedby={`layout-task-${slug(task)}`}
              onClick={() => moveUp(task)}
            >
              Move up
            </Button>
          </Card>
        </Motion>
      ))}
    </ul>
  );
}

const FAQ = [
  {
    id: "plan",
    title: "Which plan fits me?",
    text: "Start with the free plan. Upgrade when your team needs more seats or storage.",
  },
  {
    id: "cancel",
    title: "Can I cancel at any time?",
    text: "Yes. Your plan stays active until the end of the billing period.",
  },
  {
    id: "data",
    title: "Where is my data stored?",
    text: "In the region you pick when you create your workspace.",
  },
];

/** Expand: the open card grows, the cards under it slide down; its title keeps its shape. */
export function LayoutExpandDemo() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="sb-layout-stack">
      {FAQ.map((item) => (
        <Motion key={item.id} className="sb-layout-card" layout initial={false}>
          <Card className="sb-layout-card-body">
            <Motion className="sb-layout-card-head" layout="position" initial={false}>
              <Typography variant="subtitle2">{item.title}</Typography>
              <Button
                color="inherit"
                size="sm"
                aria-expanded={open === item.id}
                aria-controls={`layout-faq-${item.id}`}
                onClick={() => setOpen(open === item.id ? null : item.id)}
              >
                Details
              </Button>
            </Motion>
            <Typography
              id={`layout-faq-${item.id}`}
              variant="body2"
              color="textSecondary"
              hidden={open !== item.id}
            >
              {item.text}
            </Typography>
          </Card>
        </Motion>
      ))}
    </div>
  );
}

const PERIODS = ["Monthly", "Yearly", "Lifetime"];

/** Shared highlight: one `layoutId` moves from the selected button to the next one. */
export function LayoutHighlightDemo() {
  const [selected, setSelected] = useState(PERIODS[0]);
  return (
    // biome-ignore lint/a11y/useSemanticElements: a group of buttons, not a form field.
    <div role="group" aria-label="Billing period" className="sb-layout-segments">
      {PERIODS.map((period) => (
        <Button
          key={period}
          className="sb-layout-segment"
          color="inherit"
          aria-pressed={period === selected}
          onClick={() => setSelected(period)}
        >
          {period === selected ? (
            <Motion
              component="span"
              className="sb-layout-highlight"
              layoutId="billing-highlight"
              initial={false}
              transition={SPRING}
              aria-hidden="true"
            >
              <Paper component="span" className="sb-layout-highlight-paper" elevation={2} />
            </Motion>
          ) : null}
          {period}
        </Button>
      ))}
    </div>
  );
}
