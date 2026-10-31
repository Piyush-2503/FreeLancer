import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 30000,
    // Run test files one at a time to avoid DB conflicts
    fileParallelism: false,
    // Set test environment variables
    env: {
      NODE_ENV: 'test',
    },
  },
});
