import { defineConfig } from 'vitest/config'
import viteConfig from './vite.config'
import { mergeConfig, UserConfig } from 'vite'

const viteConfigFn = viteConfig as ({ mode }: { mode: string }) => UserConfig;

export default mergeConfig(viteConfigFn({ mode: 'test' }), defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
}))
