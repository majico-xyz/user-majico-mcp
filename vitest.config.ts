import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    deps: {
      optimizer: {
        ssr: {
          enabled: true,
        },
      },
    },
  },
});