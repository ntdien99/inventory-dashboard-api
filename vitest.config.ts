import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({
  test: {
    globals: true, // Allows using describe, test, expect without explicit imports
    environment: "node",
    setupFiles: ["./src/test/singleton.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.service.ts", "src/**/*.controller.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
