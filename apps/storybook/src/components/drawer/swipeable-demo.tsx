import {
  Drawer,
  type DrawerAnchor,
  DrawerContent,
  DrawerTrigger,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Scrollbar,
  Typography,
} from "@owlky/react";

const DRAWERS: [DrawerAnchor, string][] = [
  ["left", "Left"],
  ["bottom", "Bottom"],
];

/**
 * Swipeable drawers (MUI `SwipeableDrawer`, roadmap 4.18.46): on a touch screen, swipe from the
 * edge to open and towards the edge to close. The button stays (WCAG 2.5.7).
 */
export function SwipeableDrawerDemo() {
  return (
    <div className="sb-row">
      {DRAWERS.map(([anchor, label]) => (
        <Drawer key={anchor}>
          <DrawerTrigger variant="outlined">{label}</DrawerTrigger>
          <DrawerContent
            id={`swipeable-${anchor}`}
            anchor={anchor}
            swipeable
            aria-label={`${label} swipeable drawer`}
          >
            {/* Top and bottom drawers swipe from outside their scrolling list: the title. */}
            <Typography variant="subtitle1" component="h2" className="sb-drawer-swipe-title">
              Mailbox
            </Typography>
            <Scrollbar>
              <nav aria-label={`${label} menu`}>
                <List>
                  {["Inbox", "Starred", "Drafts", "Trash"].map((item) => (
                    <ListItem key={item} disablePadding>
                      <ListItemButton>
                        <ListItemText primary={item} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </nav>
            </Scrollbar>
          </DrawerContent>
        </Drawer>
      ))}
      <Typography variant="body2" color="textSecondary">
        On a touch screen, swipe from the left or bottom edge to open a drawer, and towards its edge
        to close it.
      </Typography>
    </div>
  );
}
