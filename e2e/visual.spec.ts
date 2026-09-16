import { test, expect } from '@playwright/test'
import { KNOWN_ARTISTS, KNOWN_PRODUCTIONS } from './fixtures/known-entities'

/**
 * Regressão visual (screenshot diffing) das páginas mais visitadas do site.
 * Baseline por browser/plataforma — os arquivos ficam em
 * e2e/visual.spec.ts-snapshots/ e são versionados no repo. Rodar com
 * `--update-snapshots` depois de uma mudança visual intencional.
 *
 * Só chromium: baselines por browser triplicariam o repo de snapshots e o
 * objetivo aqui é pegar regressão de layout/CSS, não diferenças de rendering
 * engine (isso já é coberto pelo cross-browser-smoke).
 */
test.describe('Regressão visual', () => {
    test.skip(({ browserName }) => browserName !== 'chromium', 'baseline de screenshot só em Chromium')

    test('home', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' })
        // Sem fullPage aqui: a home tem várias seções com dados ao vivo (rankings,
        // ticker, "em alta") cujo tamanho de texto varia a cada revalidação do WP,
        // deslocando a altura total da página em 1-2px e quebrando o diff de
        // imagem (Playwright não compara imagens de dimensões diferentes). Só o
        // viewport inicial (header/hero) já cobre regressão de layout/CSS.
        await expect(page).toHaveScreenshot('home.png', { maxDiffPixelRatio: 0.02 })
    })

    test(`página de artista (${KNOWN_ARTISTS[0].label})`, async ({ page }) => {
        await page.goto(`/artists/${KNOWN_ARTISTS[0].slug}`, { waitUntil: 'networkidle' })
        await expect(page).toHaveScreenshot('artist-detail.png', { fullPage: true, maxDiffPixelRatio: 0.02 })
    })

    test(`página de produção (${KNOWN_PRODUCTIONS[0].label})`, async ({ page }) => {
        await page.goto(`/productions/${KNOWN_PRODUCTIONS[0].slug}`, { waitUntil: 'networkidle' })
        await expect(page).toHaveScreenshot('production-detail.png', { fullPage: true, maxDiffPixelRatio: 0.02 })
    })
})
