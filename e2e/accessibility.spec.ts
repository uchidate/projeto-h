import { test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { KNOWN_ARTISTS, KNOWN_GROUPS, KNOWN_PRODUCTIONS } from './fixtures/known-entities'

/**
 * Checagem automatizada de acessibilidade (WCAG 2.1 AA via axe-core).
 * Cobre home + uma página de cada tipo de conteúdo principal — não a lista
 * inteira de fixtures, pra manter o tempo de execução razoável (axe-core
 * escaneia o DOM inteiro por página).
 */
const PAGES_TO_CHECK: { name: string; path: string }[] = [
    { name: 'home', path: '/' },
    { name: 'listagem de produções', path: '/productions' },
    { name: 'listagem de grupos', path: '/groups' },
    { name: `artista (${KNOWN_ARTISTS[0].label})`, path: `/artists/${KNOWN_ARTISTS[0].slug}` },
    { name: `grupo (${KNOWN_GROUPS[0].label})`, path: `/groups/${KNOWN_GROUPS[0].slug}` },
    { name: `produção (${KNOWN_PRODUCTIONS[0].label})`, path: `/productions/${KNOWN_PRODUCTIONS[0].slug}` },
]

test.describe('Acessibilidade (axe-core, WCAG 2.1 AA)', () => {
    for (const { name, path } of PAGES_TO_CHECK) {
        test(`${name} não tem violações de acessibilidade sérias/críticas`, async ({ page }) => {
            await page.goto(path, { waitUntil: 'domcontentloaded' })
            const results = await new AxeBuilder({ page })
                .withTags(['wcag2a', 'wcag2aa'])
                // Embeds de terceiros (player do YouTube) têm seu próprio markup
                // interno que não controlamos — excluído do scan pra não gerar
                // falso positivo permanente (ex: aria-prohibited-attr no player).
                .exclude('iframe')
                .analyze()

            // Só trava em 'serious'/'critical' — 'minor'/'moderate' são reportados
            // mas não bloqueiam (evita gate excessivamente rígido logo de cara;
            // reavaliar depois de zerar os achados sérios).
            const blocking = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
            if (blocking.length > 0) {
                const details = blocking.map(v =>
                    `\n- [${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} elemento(s))\n  ${v.helpUrl}`
                ).join('')
                throw new Error(`${blocking.length} violação(ões) séria(s)/crítica(s) de acessibilidade em ${path}:${details}`)
            }

            if (results.violations.length > 0) {
                console.log(`ℹ️  ${path}: ${results.violations.length} violação(ões) moderada(s)/leve(s) (não bloqueante): ${results.violations.map(v => v.id).join(', ')}`)
            }
        })
    }
})
