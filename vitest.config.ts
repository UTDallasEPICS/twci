import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules', '.nuxt', 'prisma/generated'],
    alias: {
      '~': resolve(__dirname, '.'),
      '~~': resolve(__dirname, '.'),
    },
  },
})
