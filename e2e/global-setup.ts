import {
    KNOWN_ARTISTS,
    KNOWN_GROUPS,
    KNOWN_PRODUCTIONS,
    KNOWN_AGENCIES,
    KNOWN_FOODS,
    KNOWN_COMPANIES,
    KNOWN_BLOG_POSTS,
    MERGED_ARTIST_REDIRECTS,
} from './fixtures/known-entities'

/**
 * Roda uma vez antes da suíte inteira — checa que toda fixture de
 * known-entities.ts (slugs reais hardcoded) ainda existe (HTTP 200) antes de
 * rodar qualquer teste de verdade.
 *
 * Por quê: sem isso, se um slug fixture for deletado/renomeado no WP (ex:
 * numa futura rodada de dedup de artistas, como já aconteceu em 2026-07-05),
 * cada teste que o usa falha com um erro genérico e distante ("expect
 * toHaveLength(1) received 0"), sem indicar a causa real. Este setup falha
 * rápido, uma vez, com a lista exata de fixtures quebradas — muito mais
 * fácil de diagnosticar e corrigir (atualizar known-entities.ts).
 */
async function globalSetup() {
    const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3100'

    const paths = [
        ...KNOWN_ARTISTS.map(e => `/artists/${e.slug}`),
        ...KNOWN_GROUPS.map(e => `/groups/${e.slug}`),
        ...KNOWN_PRODUCTIONS.map(e => `/productions/${e.slug}`),
        ...KNOWN_AGENCIES.map(e => `/agencies/${e.slug}`),
        ...KNOWN_FOODS.map(e => `/comidas/${e.slug}`),
        ...KNOWN_COMPANIES.map(e => `/empresas/${e.slug}`),
        ...KNOWN_BLOG_POSTS.map(e => `/blog/${e.slug}`),
        // Redirects: o destino ("to") é quem precisa existir; a origem
        // ("from") é deliberadamente um post deletado, checar isso seria
        // sempre "quebrado" por design.
        ...MERGED_ARTIST_REDIRECTS.map(r => `/artists/${r.to}`),
    ]

    // Retry só em erro de rede (fetch failed/timeout), não em HTTP não-ok — um
    // 404 é sinal real de fixture quebrada, mas "fetch failed" simultâneo em
    // várias fixtures ao mesmo tempo é a assinatura de flakiness transitória
    // do runner (mesmo padrão visto no health-monitor: rodando dentro de
    // container Docker no GH Actions, a rede tem uma camada a mais e falha
    // à toa com mais frequência do que o runner nu).
    async function checkPath(path: string, attempt = 0): Promise<string | null> {
        try {
            const res = await fetch(`${baseUrl}${path}`, { method: 'HEAD', redirect: 'follow' })
            if (!res.ok) return `${path} -> HTTP ${res.status}`
            return null
        } catch (err) {
            if (attempt < 2) {
                await new Promise(r => setTimeout(r, 3000))
                return checkPath(path, attempt + 1)
            }
            return `${path} -> erro de rede (${err instanceof Error ? err.message : err})`
        }
    }

    const results = await Promise.all(paths.map(path => checkPath(path)))
    const broken = results.filter((r): r is string => r !== null)

    if (broken.length > 0) {
        throw new Error(
            `\n\n🔴 ${broken.length} fixture(s) de e2e/fixtures/known-entities.ts não existe(m) mais — ` +
            `atualize o arquivo antes de rodar a suíte:\n` +
            broken.map(b => `   - ${b}`).join('\n') +
            '\n'
        )
    }
}

export default globalSetup
