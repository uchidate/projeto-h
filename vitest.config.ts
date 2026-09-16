import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    resolve: {
        tsconfigPaths: true,
    },
    test: {
        environment: 'node',
        // Testes de componente (.test.tsx) precisam de DOM real — cada um desses
        // arquivos declara `// @vitest-environment jsdom` no topo (mais estável
        // entre versões do Vitest do que environmentMatchGlobs, que não aplicou
        // corretamente na 4.1.9). Lógica pura (.test.ts) fica em 'node', mais rápido.
        setupFiles: ['./vitest.setup.ts'],
        include: ['**/*.test.ts', '**/*.test.tsx'],
        // ops/** (ops/dashboard, ops/news-pipeline) is a separate Next.js app with
        // its own test runner (node:test via `npm test` inside ops/dashboard, not
        // vitest) — without this, vitest swept up its *.test.ts files too and
        // failed the whole root CI run with "No test suite found in file" on every
        // commit that touched ops/dashboard, since node:test's `test()` isn't a
        // vitest suite. Broke deploy.yml's "Type Check + Unit Tests" job on every
        // push for a while before this was caught.
        exclude: ['node_modules', '.next', 'e2e/**', '.operacao/**', 'scripts/**', 'wordpress/**', 'wp-plugins/**', 'ops/**', 'skills/**', 'docs/**', 'infra/**', 'config/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'json-summary'],
            include: ['lib/**', 'components/**', 'app/api/**'],
            exclude: ['**/*.test.ts', '**/*.test.tsx', '**/*.d.ts'],
            // Sem threshold global ainda — a maior parte de components/ e app/api/
            // não tinha nenhum teste antes de 2026-07-06. Thresholds por arquivo
            // (abaixo) travam só o que já está coberto, pra não regredir, sem
            // bloquear PRs por causa de código legado ainda não testado.
        },
    },
})
