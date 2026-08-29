import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // convex-test runs Convex functions in a Workers-like runtime, not Node.
    environment: "edge-runtime",
    // Only the suites written against vitest. `packages/github` uses node:test
    // and runs through its own `npm test`.
    include: ["convex/**/*.test.ts", "packages/auth/src/**/*.test.ts"],
    server: { deps: { inline: ["convex-test"] } },
  },
});
