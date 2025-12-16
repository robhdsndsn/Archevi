import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        'src/components/ui/', // shadcn components - tested upstream
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      thresholds: {
        // Target: 90% coverage - start lower and increase as tests are added
        statements: 50,
        branches: 50,
        functions: 50,
        lines: 50,
      },
    },
    // Better test output
    reporters: ['default'],
    // Timeout for slow tests
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
