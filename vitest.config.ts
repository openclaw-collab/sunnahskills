import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

const alias = {
  "@": path.resolve(__dirname, "client", "src"),
  "@shared": path.resolve(__dirname, "shared"),
  "@assets": path.resolve(__dirname, "attached_assets"),
};

// Unit + integration tests only (jsdom, no browser)
export default defineConfig({
  plugins: [react()],
  resolve: { alias },
  esbuild: {
    target: "es2022"
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    include: ["client/src/__tests__/**/*.test.{ts,tsx}", "shared/__tests__/**/*.test.ts"],
    exclude: ["node_modules", "dist", ".idea", ".git", ".cache", "**/*.e2e.test.{ts,tsx}", "client/src/__tests__/integration/**", "**/__stories__/**", "**/*.stories.{ts,tsx}"],
    reporters: ["verbose"],
    testTimeout: 10000,
    hookTimeout: 10000,
    isolate: true,
    pool: "threads",
    projects: [
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: "unit",
          environment: "jsdom",
          setupFiles: ["./vitest.setup.ts"],
          globals: true,
          include: ["client/src/__tests__/**/*.test.{ts,tsx}", "shared/__tests__/**/*.test.ts"],
          exclude: ["node_modules", "dist", ".idea", ".git", ".cache", "**/*.e2e.test.{ts,tsx}", "client/src/__tests__/integration/**", "**/__stories__/**", "**/*.stories.{ts,tsx}"],
          testTimeout: 10000,
          hookTimeout: 10000,
          isolate: true,
          pool: "threads"
        }
      },
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: "integration",
          environment: "jsdom",
          setupFiles: ["./vitest.setup.ts", "./client/src/__tests__/integration/setup.ts"],
          globals: true,
          include: ["client/src/__tests__/integration/**/*.test.{ts,tsx}"],
          exclude: ["node_modules", "dist", ".idea", ".git", ".cache"],
          testTimeout: 10000,
          hookTimeout: 10000,
          isolate: true,
          pool: "threads"
        }
      }
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "client/src/__tests__/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mock*.ts",
        "**/fixture*.ts",
        "storybook-static/",
        "stories/",
        "e2e/"
      ],
      include: ["client/src/**/*.{ts,tsx}", "shared/**/*.ts"],
      thresholds: {
        statements: 25,
        branches: 25,
        functions: 25,
        lines: 25
      }
    }
  }
});
