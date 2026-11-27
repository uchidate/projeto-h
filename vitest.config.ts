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
        // Avisos que o cliente do WordPress emite ao simular falhas do CMS em
        // teste (503 com retentativa, JSON invalido, sitemap com backoff): sao o
        // comportamento verificado, nao problema. So a IMPRESSAO some; spies que
        // conferem a chamada continuam vendo, e em producao nada muda.
        onConsoleLog(log) {
            if (/^(WordPress API (error|unavailable|returned invalid JSON)|\[sitemap\] )/.test(log)) return false
        },
        include: ['**/*.test.ts', '**/*.test.tsx'],
        // ops/** (ops/dashboard, ops/news-pipeline) is a separate Next.js app with
        // its own test runner (node:test via `npm test` inside ops/dashboard, not
        // vitest) — without this, vitest swept up its *.test.ts files too and
        // failed the whole root CI run with "No test suite found in file" on every
        // commit that touched ops/dashboard, since node:test's `test()` isn't a
        // vitest suite. Quebrou o job de tipos e testes do CI (hoje quality.yml)
        // em todo push, por um tempo, antes de ser percebido.
        exclude: ['node_modules', '.next', 'e2e/**', '.operacao/**', 'scripts/**', 'wordpress/**', 'wp-plugins/**', 'ops/**', 'skills/**', 'docs/**', 'infra/**', 'config/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'json-summary'],
            include: ['lib/**', 'components/**', 'app/api/**'],
            exclude: ['**/*.test.ts', '**/*.test.tsx', '**/*.d.ts'],
            // Pisos medidos em 2026-11-27 (total 73,8% linhas / 64,2% ramos / 68,3% funções;
            // components/ 68,6 / 58,8 / 61,8, depois dos testes das listagens, fichas (inclusive
            // artista e grupo), quiz, guias, calendário e home; lib/ quase todo acima de 70%). Cada piso fica ~5 pontos abaixo do
            // medido: trava regressão sem bloquear PR por código legado ainda sem teste. Só
            // vale quando a cobertura roda (`npm run test:coverage`, que o CI usa). Ao subir
            // a cobertura de uma pasta, suba o piso junto — nunca baixe.
            thresholds: {
                lines: 68,
                branches: 59,
                functions: 63,
                'components/**': { lines: 63, branches: 53, functions: 56 },
                'lib/wordpress/**': { lines: 72, branches: 73, functions: 64 },
                'lib/i18n/**': { lines: 65, branches: 69, functions: 74 },
                'lib/seo/**': { lines: 75, branches: 71, functions: 78 },
                'lib/blog/**': { lines: 77, branches: 74, functions: 81 },
                'lib/guias/**': { lines: 86, branches: 74, functions: 87 },
                'lib/search/**': { lines: 85, branches: 77, functions: 81 },
                'lib/profiles/**': { lines: 95, branches: 81, functions: 91 },
                'lib/home/**': { lines: 86, branches: 60, functions: 70 },
                'lib/agencies/**': { lines: 69, branches: 64, functions: 81 },
                'lib/artists/**': { lines: 81, branches: 80, functions: 76 },
            },
        },
    },
})
