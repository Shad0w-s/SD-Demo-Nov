import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    // jsx: 'react' is not a valid Vitest config option - React support is handled via setupFiles
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['@arcgis/core'],
  },
  ssr: {
    noExternal: ['@arcgis/core'],
  },
})
