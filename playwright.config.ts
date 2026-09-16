import { defineConfig, devices } from '@playwright/test'

const PORT = 3100
const baseURL = process.env.E2E_BASE_URL || `http://localhost:${PORT}`

export default defineConfig({
    testDir: './e2e',
    globalSetup: require.resolve('./e2e/global-setup.ts'),
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    // Testes são leituras read-only e independentes contra produção — sem
    // estado compartilhado entre eles, então rodar em série (workers: 1, o
    // default de boilerplate do Playwright) só deixa o smoke lento à toa.
    workers: process.env.CI ? 4 : undefined,
    reporter: process.env.CI ? 'github' : 'list',
    timeout: 30_000,
    use: {
        baseURL,
        trace: 'on-first-retry',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        // firefox/webkit: cross-browser roda só no smoke.spec.ts (via --grep no CI),
        // não nas suítes completas (a11y/performance/visual) — evitaria triplicar
        // o tempo de execução sem ganho real (essas checagens já são chromium-only
        // por natureza ou têm baseline de screenshot por browser).
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    ],
    // Contra o servidor de produção por padrão (site headless, sem seed de dados
    // local) — para rodar contra dev local, exporte E2E_BASE_URL=http://localhost:3000
    // e não defina webServer (Next.js precisa da API do WP configurada).
    webServer: process.env.E2E_BASE_URL ? undefined : {
        command: `npm run dev -- -p ${PORT}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
    },
})
