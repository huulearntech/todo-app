import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./"),
    },
  },
  test: {
    environment: "node",
    env: {
      NEXT_PUBLIC_API_BASE_URL: "http://localhost:4000",
    },
  },
});
