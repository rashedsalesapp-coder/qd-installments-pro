import { defineConfig } from 'vitest/config'
import viteConfig from './vite.config'
import { mergeConfig } from 'vite'

export default mergeConfig(viteConfig, defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
}))
