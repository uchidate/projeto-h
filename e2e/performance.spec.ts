import { test, expect } from '@playwright/test'
import { KNOWN_ARTISTS, KNOWN_PRODUCTIONS } from './fixtures/known-entities'

/**
 * Orçamento de performance (Core Web Vitals) via PerformanceObserver no browser.
 * Roda só em Chromium — LCP/CLS não são expostos de forma equivalente em
 * WebKit/Firefox, e o objetivo aqui é orçamento (regressão grosseira), não
 * medição precisa cross-browser (isso é papel do CrUX/PageSpeed real).
 */
const PAGES_TO_CHECK: { name: string; path: string }[] = [
    { name: 'home', path: '/' },
    { name: `artista (${KNOWN_ARTISTS[0].label})`, path: `/artists/${KNOWN_ARTISTS[0].slug}` },
    { name: `produção (${KNOWN_PRODUCTIONS[0].label})`, path: `/productions/${KNOWN_PRODUCTIONS[0].slug}` },
]

// Orçamentos alinhados aos limiares "Good" do Core Web Vitals do Google,
// com folga pra ambiente de CI (rede/CPU variáveis, sem CDN de produção).
// TBT com folga bem maior que LCP/CLS: runners compartilhados do GitHub Actions
// têm CPU com throttling variável (noisy neighbor) que infla `longtask` de forma
// desproporcional — mesma página que dá TBT~100ms local/produção já foi vista
// batendo 2750ms num runner do CI sem nenhuma regressão real de código.
const BUDGETS = {
    lcp: 4000,   // ms — "Good" oficial é 2500, damos folga de CI
    cls: 0.1,    // "Good" oficial
    tbt: 5000,   // ms — proxy de INP/TBT via long tasks; ver comentário acima
}

async function collectVitals(page: import('@playwright/test').Page) {
    return page.evaluate(
        () =>
            new Promise<{ lcp: number; cls: number; tbt: number }>(resolve => {
                let lcp = 0
                let cls = 0
                let tbt = 0

                new PerformanceObserver(list => {
                    const entries = list.getEntries()
                    const last = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number }
                    if (last) lcp = last.renderTime || last.loadTime || lcp
                }).observe({ type: 'largest-contentful-paint', buffered: true })

                new PerformanceObserver(list => {
                    for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
                        if (!entry.hadRecentInput) cls += entry.value
                    }
                }).observe({ type: 'layout-shift', buffered: true })

                new PerformanceObserver(list => {
                    for (const entry of list.getEntries()) {
                        const blocking = entry.duration - 50
                        if (blocking > 0) tbt += blocking
                    }
                }).observe({ type: 'longtask', buffered: true })

                // Dá tempo pros observers acumularem entries após o load.
                setTimeout(() => resolve({ lcp, cls, tbt }), 2000)
            })
    )
}

test.describe('Orçamento de performance (Core Web Vitals)', () => {
    for (const { name, path } of PAGES_TO_CHECK) {
        test(`${name} respeita o orçamento de LCP/CLS/TBT`, async ({ page, browserName }) => {
            test.skip(browserName !== 'chromium', 'LCP/CLS/longtask só são medidos de forma confiável em Chromium')

            await page.goto(path, { waitUntil: 'load' })
            const vitals = await collectVitals(page)

            console.log(`ℹ️  ${path}: LCP=${vitals.lcp.toFixed(0)}ms CLS=${vitals.cls.toFixed(3)} TBT=${vitals.tbt.toFixed(0)}ms`)

            expect(vitals.lcp, `LCP em ${path}`).toBeLessThan(BUDGETS.lcp)
            expect(vitals.cls, `CLS em ${path}`).toBeLessThan(BUDGETS.cls)
            expect(vitals.tbt, `TBT em ${path}`).toBeLessThan(BUDGETS.tbt)
        })
    }
})
