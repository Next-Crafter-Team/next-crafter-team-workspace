import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // convex-test runs Convex functions in a Workers-like runtime, not Node.
    environment: "edge-runtime",
    include: ["convex/**/*.test.ts", "packages/*/src/**/*.test.ts"],
    server: { deps: { inline: ["convex-test"] } },
  },
});
