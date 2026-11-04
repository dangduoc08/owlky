/** Viewport matrix shared by responsive and visual tests (see /component → Viewport matrix). */
export const viewports = [
  { name: "mobile", width: 375, height: 812, touch: true },
  { name: "mobile-lg", width: 430, height: 932, touch: true },
  { name: "tablet", width: 768, height: 1024, touch: true },
  { name: "laptop", width: 1280, height: 800, touch: false },
  { name: "desktop", width: 1440, height: 900, touch: false },
] as const;

export type Viewport = (typeof viewports)[number];
