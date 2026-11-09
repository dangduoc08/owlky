/** Vite `?url` imports (tests load MapLibre's worker this way). */
declare module "*?url" {
  const url: string;
  export default url;
}
