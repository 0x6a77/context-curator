import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Per-test and per-hook timeout. Tests that exceed this are considered flaky and fail.
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['scripts/**/*.ts'],
    },
    // Each test file gets its own worker process (isolated temp dirs make this safe).
    pool: 'forks',
    maxWorkers: 4,
    minWorkers: 1,
  },
});
