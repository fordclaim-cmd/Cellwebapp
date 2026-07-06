import { defineConfig } from 'vitest/config';

// Unit tests live under api/. e2e/*.spec.ts is Playwright — run via `npm run test:e2e`,
// not vitest. Scoping include here keeps vitest from collecting the Playwright suite.
export default defineConfig({
  test: {
    include: ['api/**/*.test.ts'],
  },
});
