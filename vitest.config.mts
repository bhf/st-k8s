import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    alias: {
      '@': resolve(__dirname, './src'),
    },
    // exclude implementation details like .next folder
    exclude: ['node_modules', '.next', '.git', 'e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'json-summary'],
      exclude: [
        'node_modules/',
        'vitest.setup.ts',
        'vitest.config.mts',
        'next.config.ts',
        'postcss.config.mjs',
        'tailwind.config.ts',
        'playwright.config.ts',
        'eslint.config.mjs',
        'e2e/',
        'src/app/layout.tsx', // Next.js layout usually doesn't need unit tests
        'docs/',
        'public/',
      ],
    },
  },
})
