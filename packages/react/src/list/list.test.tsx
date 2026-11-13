import { listSubheaderColors } from "@owlky/core";
import { render, screen } from "@testing-library/react";
import { createRef, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { Checkbox } from "../checkbox/checkbox.js";
import { IconButton } from "../icon-button/icon-button.js";
import { expectNoAxeViolations, settled } from "../test-utils.js";
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemExpandIcon,
  ListItemIcon,
  ListItemText,
  ListSubheader,
} from "./list.js";

const HOSTILE = '"><img src=x onerror=alert(1)>' as never;
const css = (element: Element) => getComputedStyle(element);
const box = (element: Element) => element.getBoundingClientRect();

function Icon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8" fill="currentColor" />
    </svg>
  );
}

function Nested() {
  const [open, setOpen] = useState(true);
  return (
    <List>
      <ListItem disablePadding>
        <ListItemButton aria-expanded={open} aria-controls="nested" onClick={() => setOpen(!open)}>
          <ListItemText primary="Inbox" />
          <ListItemExpandIcon />
        </ListItemButton>
        <List id="nested" disablePadding hidden={!open}>
          <ListItem disablePadding>
            <ListItemButton>
              <ListItemText primary="Starred" />
            </ListItemButton>
          </ListItem>
        </List>
      </ListItem>
    </List>
  );
}

describe("List", () => {
  it("renders a ul with 8px padding, rows of 40px (icon) and 38px (text only)", () => {
    render(
      <List aria-label="Mailbox" style={{ width: 300 }}>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <Icon />
            </ListItemIcon>
            <ListItemText primary="Inbox" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemText primary="Trash" />
          </ListItemButton>
        </ListItem>
      </List>,
    );
    const list = screen.getByRole("list");
    expect(list.localName).toBe("ul");
    expect(list.dataset).toMatchObject({ okList: "", okRuntime: "off" });
    expect(css(list).paddingTop).toBe("8px");
    expect(css(list).listStyleType).toBe("none");
    const [inbox, trash] = screen.getAllByRole("button");
    expect(inbox?.getAttribute("type")).toBe("button");
    expect(box(inbox as Element).height).toBe(40);
    expect(box(trash as Element).height).toBeCloseTo(38, 0);
    expect(box(inbox as Element).width).toBe(300);
    const icon = inbox?.querySelector("[data-ok-list-item-icon]") as Element;
    expect(css(icon).marginRight).toBe("16px");
    expect(box(icon.querySelector("svg") as Element).width).toBe(24);
    const primary = screen.getByText("Inbox");
    expect(primary.hasAttribute("data-ok-list-item-text-primary")).toBe(true);
    expect(css(primary)).toMatchObject({ fontSize: "14px", fontWeight: "600" });
    expect(Number.parseFloat(css(primary).lineHeight)).toBeCloseTo(22, 0);
  });

  it("dense and disablePadding", () => {
    render(
      <List dense disablePadding>
        <ListItem data-testid="item">
          <ListItemText primary="Dense" />
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemText primary="Button" />
          </ListItemButton>
        </ListItem>
      </List>,
    );
    const list = screen.getByRole("list");
    expect(css(list).paddingTop).toBe("0px");
    expect(css(list).paddingBottom).toBe("0px");
    expect(css(screen.getByTestId("item")).paddingTop).toBe("4px");
    expect(css(screen.getByRole("button")).paddingTop).toBe("4px");
    expect(box(screen.getByRole("button")).height).toBeCloseTo(30, 0);
  });

  it("subheader: first row, sticky, 48px line, secondary color; list padding-top 0", () => {
    render(
      <List
        aria-labelledby="sub"
        subheader={<ListSubheader id="sub">Nested list items</ListSubheader>}
      >
        <ListItem>
          <ListItemText primary="Sent mail" />
        </ListItem>
      </List>,
    );
    const list = screen.getByRole("list", { name: "Nested list items" });
    const sub = screen.getByText("Nested list items");
    expect(list.firstElementChild).toBe(sub);
    expect(css(list).paddingTop).toBe("0px");
    expect(sub.dataset).toMatchObject({ okListSubheader: "", okColor: "default" });
    expect(css(sub)).toMatchObject({ position: "sticky", lineHeight: "48px", fontWeight: "500" });
    expect(css(sub).color).toBe("rgb(82, 82, 92)");
  });

  it.each(listSubheaderColors)("subheader color %s", (color) => {
    render(
      <ul style={{ color: "rgb(1, 2, 3)" }}>
        <ListSubheader color={color} disableGutters disableSticky inset>
          Heading
        </ListSubheader>
      </ul>,
    );
    const sub = screen.getByText("Heading");
    expect(sub.dataset["okColor"]).toBe(color);
    expect(css(sub).position).toBe("static");
    expect(css(sub).paddingLeft).toBe("56px");
    expect(css(sub).paddingRight).toBe("0px");
    if (color === "inherit") expect(css(sub).color).toBe("rgb(1, 2, 3)");
    if (color === "primary") expect(css(sub).color).toBe("rgb(79, 57, 246)");
  });

  it("two-line text with an avatar; alignItems flex-start moves the avatar down", () => {
    render(
      <List>
        <ListItem alignItems="flex-start" data-testid="item">
          <ListItemAvatar>
            <span style={{ display: "block", width: 40, height: 40 }} />
          </ListItemAvatar>
          <ListItemText primary="Photos" secondary="Jan 9, 2014" />
        </ListItem>
      </List>,
    );
    const item = screen.getByTestId("item");
    expect(item.dataset["okAlignItems"]).toBe("flex-start");
    expect(css(item).alignItems).toBe("flex-start");
    const avatar = item.querySelector("[data-ok-list-item-avatar]") as Element;
    expect(css(avatar).marginTop).toBe("8px");
    const secondary = screen.getByText("Jan 9, 2014");
    expect(secondary.hasAttribute("data-ok-list-item-text-secondary")).toBe(true);
    expect(css(secondary)).toMatchObject({ fontSize: "14px", fontWeight: "400" });
    expect(css(secondary).color).toBe("rgb(82, 82, 92)");
  });

  it("text: children as primary, inset, disableTypography", () => {
    render(
      <ul>
        <ListItem>
          <ListItemText inset data-testid="a">
            Child text
          </ListItemText>
        </ListItem>
        <ListItem>
          <ListItemText disableTypography data-testid="b" primary={<b>Raw</b>} secondary="Two" />
        </ListItem>
        <ListItem>
          <ListItemText data-testid="c" secondary="Only secondary" />
        </ListItem>
      </ul>,
    );
    const a = screen.getByTestId("a");
    expect(a.dataset["okInset"]).toBe("");
    expect(css(a).paddingLeft).toBe("40px");
    expect(a.querySelector("[data-ok-list-item-text-primary]")?.textContent).toBe("Child text");
    const b = screen.getByTestId("b");
    expect(b.querySelector("[data-ok-list-item-text-primary]")).toBeNull();
    expect(b.innerHTML).toBe("<b>Raw</b>Two");
    expect(screen.getByTestId("c").querySelector("[data-ok-list-item-text-primary]")).toBeNull();
  });

  it("selected: primary tint; hover darker; focus-visible outline", async () => {
    render(
      <List>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemText primary="Inbox" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton selected aria-current="page">
            <ListItemText primary="Drafts" />
          </ListItemButton>
        </ListItem>
      </List>,
    );
    const [inbox, drafts] = screen.getAllByRole("button") as [HTMLElement, HTMLElement];
    expect(drafts.dataset["okSelected"]).toBe("");
    expect(css(drafts).backgroundColor).toBe("rgba(97, 95, 255, 0.08)");
    expect(css(inbox).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    await userEvent.hover(drafts);
    await settled(drafts);
    expect(css(drafts).backgroundColor).toBe("rgba(97, 95, 255, 0.16)");
    await userEvent.unhover(drafts);
    (screen.getAllByRole("button")[0] as HTMLElement).focus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(drafts);
    expect(css(drafts).outlineStyle).toBe("solid");
    expect(css(drafts).outlineWidth).toBe("2px");
  });

  it("disabled button and link; links render an a with the row styling", async () => {
    const onClick = vi.fn();
    render(
      <List>
        <ListItem disablePadding>
          <ListItemButton disabled onClick={onClick}>
            Off
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton href="#inbox">Inbox</ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton href="#spam" disabled>
            Spam
          </ListItemButton>
        </ListItem>
      </List>,
    );
    const off = screen.getByRole("button", { name: "Off" });
    expect((off as HTMLButtonElement).disabled).toBe(true);
    expect(css(off).opacity).toBe("0.48");
    await userEvent.click(off, { force: true });
    expect(onClick).not.toHaveBeenCalled();
    const inbox = screen.getByRole("link", { name: "Inbox" });
    expect(inbox.getAttribute("href")).toBe("#inbox");
    expect(inbox.hasAttribute("data-ok-list-item-button")).toBe(true);
    expect(css(inbox).display).toBe("flex");
    const spam = screen.getByRole("link", { name: "Spam" });
    expect(spam.hasAttribute("href")).toBe(false);
    expect(spam.getAttribute("aria-disabled")).toBe("true");
    expect(css(spam).opacity).toBe("0.48");
  });

  it("item flags: gutters, divider, secondary action", () => {
    render(
      <List style={{ width: 300 }}>
        <ListItem
          disableGutters
          divider
          data-testid="a"
          secondaryAction={
            <IconButton edge="end" aria-label="Comment">
              <Icon />
            </IconButton>
          }
        >
          <ListItemText primary="Line item" />
        </ListItem>
        <ListItem
          disablePadding
          data-testid="b"
          secondaryAction={
            <IconButton edge="end" aria-label="Comment 2">
              <Icon />
            </IconButton>
          }
        >
          <ListItemButton dense divider disableGutters alignItems="flex-start">
            Row
          </ListItemButton>
        </ListItem>
      </List>,
    );
    const a = screen.getByTestId("a");
    expect(css(a).paddingLeft).toBe("0px");
    expect(css(a).paddingRight).toBe("48px");
    expect(css(a).borderBottomWidth).toBe("1px");
    const action = a.querySelector("[data-ok-list-item-secondary-action]") as Element;
    expect(css(action).position).toBe("absolute");
    expect(box(action).right).toBe(box(a).right - 16);
    const row = screen.getByRole("button", { name: "Row" });
    expect(css(screen.getByTestId("b")).paddingRight).toBe("0px");
    expect(css(row).paddingRight).toBe("48px");
    expect(css(row).paddingLeft).toBe("0px");
    expect(css(row).borderBottomWidth).toBe("1px");
    expect(css(row).alignItems).toBe("flex-start");
    expect(box(row).width).toBe(300);
  });

  it("nested list from app state: aria-expanded, hidden, expand icon turns", async () => {
    render(<Nested />);
    const inbox = screen.getByRole("button", { name: "Inbox" });
    const starred = screen.getByRole("button", { name: "Starred" });
    expect(css(starred).paddingLeft).toBe("32px");
    expect(box(starred).top).toBeGreaterThanOrEqual(box(inbox).bottom);
    const expand = inbox.querySelector("[data-ok-list-item-expand-icon]") as HTMLElement;
    expect(expand.getAttribute("aria-hidden")).toBe("true");
    expect(css(expand).transform).not.toBe("none");
    await userEvent.click(inbox);
    expect(inbox.getAttribute("aria-expanded")).toBe("false");
    expect(css(document.getElementById("nested") as Element).display).toBe("none");
    await settled(expand);
    expect(css(expand).transform).toBe("none");
    render(
      <ListItemExpandIcon data-testid="custom">
        <i>v</i>
      </ListItemExpandIcon>,
    );
    expect(screen.getByTestId("custom").innerHTML).toBe("<i>v</i>");
  });

  it("checkbox in the icon slot lines up its box with the row's icons", () => {
    render(
      <List dense>
        <ListItem disablePadding>
          <ListItemButton data-testid="row">
            <ListItemIcon>
              <Checkbox aria-labelledby="t1" />
            </ListItemIcon>
            <ListItemText id="t1" primary="Line item 1" />
          </ListItemButton>
        </ListItem>
      </List>,
    );
    const root = document.querySelector("[data-ok-checkbox]") as Element;
    expect(css(root).marginLeft).toBe("-8px");
    expect(css(root).marginTop).toBe("-4px");
    expect(css(root.parentElement as Element).marginRight).toBe("4px");
  });

  it("forwards refs and rest props; hostile option values never reach the DOM", () => {
    const list = createRef<HTMLUListElement>();
    const item = createRef<HTMLLIElement>();
    const button = createRef<HTMLButtonElement | HTMLAnchorElement>();
    const text = createRef<HTMLSpanElement>();
    const sub = createRef<HTMLLIElement>();
    const { container } = render(
      <List ref={list} dense={HOSTILE} className="x">
        <ListSubheader ref={sub} color={HOSTILE}>
          S
        </ListSubheader>
        <ListItem ref={item} alignItems={HOSTILE}>
          <ListItemButton ref={button} alignItems={HOSTILE} selected={HOSTILE}>
            <ListItemIcon>i</ListItemIcon>
            <ListItemText ref={text} primary="T" />
          </ListItemButton>
        </ListItem>
      </List>,
    );
    expect(list.current?.className).toBe("x");
    expect(item.current?.localName).toBe("li");
    expect(button.current?.localName).toBe("button");
    expect(text.current?.hasAttribute("data-ok-list-item-text")).toBe(true);
    expect(sub.current?.dataset["okColor"]).toBe("default");
    expect(container.innerHTML).not.toContain("onerror");
  });

  it("server-renders the same markup", () => {
    const html = renderToString(
      <List subheader={<ListSubheader>S</ListSubheader>}>
        <ListItem disablePadding secondaryAction={<span>a</span>}>
          <ListItemButton selected>
            <ListItemAvatar>A</ListItemAvatar>
            <ListItemText primary="P" secondary="S" />
          </ListItemButton>
        </ListItem>
      </List>,
    );
    expect(html).toContain('data-ok-list=""');
    expect(html).toContain('data-ok-list-item-secondary-action=""');
    expect(html).toContain('data-ok-selected=""');
    expect(html).toContain('data-ok-list-item-avatar=""');
  });

  it("has no axe violations", async () => {
    render(
      <nav aria-label="Mailbox">
        <List subheader={<ListSubheader>Mail</ListSubheader>}>
          <ListItem disablePadding>
            <ListItemButton selected aria-current="page">
              <ListItemIcon>
                <Icon />
              </ListItemIcon>
              <ListItemText primary="Inbox" secondary="3 new" />
            </ListItemButton>
          </ListItem>
          <ListItem
            secondaryAction={
              <IconButton edge="end" aria-label="Comment">
                <Icon />
              </IconButton>
            }
          >
            <ListItemText primary="Line item" />
          </ListItem>
        </List>
      </nav>,
    );
    await expectNoAxeViolations();
  });
});
