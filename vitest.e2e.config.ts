import { defineConfig } from 'vitest/config'
import path from 'path'

/**
 * Config separada para os testes E2E: servidor de produção real
 * (next build + .next/standalone/server.js) + SQLite real, sem mocks.
 *
 * Não roda no `pnpm test` padrão — use `pnpm test:e2e`.
 */
export default defineConfig({
  test: {
    name: 'e2e',
    environment: 'node',
    include: ['__tests__/e2e/**/*.test.ts'],
    globalSetup: ['./__tests__/e2e/global-setup.ts'],
    // Requests HTTP contra o servidor real: folga acima do default.
    testTimeout: 30_000,
    hookTimeout: 120_000,
    // Os cenários simulam um fluxo sequencial de agente — nada em paralelo.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
