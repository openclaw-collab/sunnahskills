import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets")
    }
  },
  esbuild: {
    target: "es2022"
  },
  test: {
    reporters: ["verbose"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "client/src/__tests__/", "**/*.d.ts", "**/*.config.*", "**/mock*.ts", "**/fixture*.ts"],
      include: ["client/src/**/*.{ts,tsx}", "shared/**/*.ts"],
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70
      }
    },
    projects: [{
      extends: true,
      test: {
        environment: "jsdom",
        setupFiles: ["./vitest.setup.ts", "./client/src/__tests__/integration/setup.ts"],
        globals: true,
        include: ["client/src/__tests__/**/*.test.{ts,tsx}", "shared/__tests__/**/*.test.ts"],
        exclude: ["node_modules", "dist", ".idea", ".git", ".cache", "**/*.e2e.test.{ts,tsx}"],
        testTimeout: 10000,
        hookTimeout: 10000,
        isolate: true,
        maxConcurrency: 5,
        // Vitest 4 pool configuration (top-level)
        pool: "threads",
        singleThread: false
      }
    }, {
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        }
      }
    }]
  }
});