// Tests only (test-utils.ts): Vite's `?worker` imports.
declare module "*?worker" {
  const WorkerConstructor: new () => Worker;
  export default WorkerConstructor;
}
