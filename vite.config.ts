import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const repoRoot = import.meta.dirname;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(repoRoot, "client", "src"),
      "@shared": path.resolve(repoRoot, "shared"),
      "@assets": path.resolve(repoRoot, "attached_assets"),
      "@grapplemap-preview": path.resolve(repoRoot, "GrappleMap", "preview", "src"),
    },
  },
  root: path.resolve(repoRoot, "client"),
  build: {
    outDir: path.resolve(repoRoot, "dist"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
      allow: [repoRoot, path.resolve(repoRoot, "client"), path.resolve(repoRoot, "GrappleMap")],
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8788",
        changeOrigin: true,
      },
    },
  },
});
