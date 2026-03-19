import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'functions',
    include: ['functions/__tests__/**/*.test.ts'],
    globals: true,
    environment: 'node',
    setupFiles: ['./functions/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['functions/**/*.ts'],
      exclude: [
        'functions/__tests__/**',
        'functions/**/*.d.ts',
      ],
    },
    deps: {
      inline: ['bcryptjs'],
    },
  },
  resolve: {
    alias: {
      '@': './src',
    },
  },
});
