/** Vite `?url` imports (tests load MapLibre's worker this way). */
declare module "*?url" {
  const url: string;
  export default url;
}

/** Vite `?raw` imports (illustration tests load the built token and illustration CSS). */
declare module "*?raw" {
  const text: string;
  export default text;
}
