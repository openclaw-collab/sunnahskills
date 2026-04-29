import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

const alias = {
  "@": path.resolve(__dirname, "client", "src"),
  "@shared": path.resolve(__dirname, "shared"),
  "@assets": path.resolve(__dirname, "attached_assets"),
};

export default defineConfig({
  plugins: [react()],
  resolve: { alias },
  esbuild: {
    target: "es2022",
  },
  test: {
    name: "functions",
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    include: [
      "functions/__tests__/guardian-account.test.ts",
      "functions/__tests__/admin-contacts-reply.test.ts",
      "functions/__tests__/register-cart.test.ts",
      "functions/__tests__/programs-location.test.ts",
      "functions/__tests__/waivers.test.ts",
      "functions/__tests__/utils.test.ts",
      "functions/__tests__/payments.test.ts",
      "functions/__tests__/grapplemap-sequences.test.ts",
    ],
    exclude: ["node_modules", "dist", ".idea", ".git", ".cache"],
    reporters: ["verbose"],
    testTimeout: 10000,
    hookTimeout: 10000,
    isolate: true,
    pool: "threads",
  },
});
