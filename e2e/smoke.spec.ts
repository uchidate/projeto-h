import { test, expect } from '@playwright/test'
import { BasePage } from './pages/BasePage'
import { ArtistPage } from './pages/ArtistPage'
import { GroupPage } from './pages/GroupPage'
import { ProductionPage } from './pages/ProductionPage'
import { AgencyPage } from './pages/AgencyPage'
import { GenericDetailPage } from './pages/GenericDetailPage'
import { ListingPage } from './pages/ListingPage'
import {
    KNOWN_ARTISTS,
    KNOWN_GROUPS,
    KNOWN_PRODUCTIONS,
    KNOWN_AGENCIES,
    KNOWN_FOODS,
    KNOWN_COMPANIES,
    KNOWN_BLOG_POSTS,
    KNOWN_NONEXISTENT_SLUG,
    GENRE_WITH_UNIQUE_HUB,
    MERGED_ARTIST_REDIRECTS,
} from './fixtures/known-entities'

test.describe('páginas principais carregam', () => {
    test('home', async ({ page }) => {
        const res = await page.goto('/', { waitUntil: 'domcontentloaded' })
        expect(res?.status()).toBe(200)
        await expect(page).toHaveTitle(/Portal/)
    })

    for (const kind of ['productions', 'artists', 'groups', 'agencies', 'comidas', 'empresas', 'blog', 'guias'] as const) {
        test(`listagem de ${kind}`, async ({ page }) => {
            const listing = new ListingPage(page, kind)
            const res = await listing.open()
            expect(res?.status()).toBe(200)
        })
    }

    test('slug inexistente retorna 404 de verdade (não 200)', async ({ page }) => {
        const res = await page.goto(`/artists/${KNOWN_NONEXISTENT_SLUG}`, { waitUntil: 'domcontentloaded' })
        expect(res?.status()).toBe(404)
    })
})

test.describe('JSON-LD estruturado', () => {
    // Regressão: em 2026-07-05, artists/[slug]/page.tsx emitia Person +
    // Breadcrumb duplicados (um schema próprio da página + outro já existente
    // em ArtistDetailPage.tsx), com um birthDate em formato inválido.
    for (const { slug, label } of KNOWN_ARTISTS) {
        test(`artista ${label} emite exatamente 1 Person e 1 BreadcrumbList`, async ({ page }) => {
            const artist = new ArtistPage(page, slug)
            await artist.open()
            expect(await artist.getJsonLdByType('Person')).toHaveLength(1)
            expect(await artist.getBreadcrumbSchemas()).toHaveLength(1)
        })

        test(`artista ${label} tem birthDate em ISO 8601 quando presente`, async ({ page }) => {
            const artist = new ArtistPage(page, slug)
            await artist.open()
            const person = await artist.getPersonSchema()
            if (person?.birthDate) {
                expect(person.birthDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
            }
        })
    }

    // Regressão: GroupDetailPage.tsx tinha um BreadcrumbList próprio duplicando
    // o de groups/[slug]/page.tsx (bug pré-existente, corrigido em 2026-07-05).
    for (const { slug, label } of KNOWN_GROUPS) {
        test(`grupo ${label} emite exatamente 1 MusicGroup e 1 BreadcrumbList`, async ({ page }) => {
            const group = new GroupPage(page, slug)
            await group.open()
            expect(await group.getJsonLdByType('MusicGroup')).toHaveLength(1)
            expect(await group.getBreadcrumbSchemas()).toHaveLength(1)
        })
    }

    // Regressão: campos ACF vazios (ex: numberOfEpisodes) chegavam como null e
    // JSON.stringify padrão mantém null literal — tipo inválido para o
    // schema.org. Corrigido em components/seo/JsonLd.tsx (2026-07-05).
    for (const { slug, label } of KNOWN_PRODUCTIONS) {
        test(`produção ${label} não tem null literal em nenhum bloco JSON-LD`, async ({ page }) => {
            const production = new ProductionPage(page, slug)
            await production.open()
            const blocks = await production.getJsonLdBlocks()
            for (const block of blocks) {
                expect(BasePage.containsLiteralNull(block), `bloco ${block['@type']} não deveria ter null literal`).toBe(false)
            }
        })
    }

    for (const { slug, label } of KNOWN_AGENCIES) {
        test(`agência ${label} emite exatamente 1 Organization e 1 BreadcrumbList`, async ({ page }) => {
            const agency = new AgencyPage(page, slug)
            await agency.open()
            expect(await agency.getJsonLdByType('Organization')).toHaveLength(1)
            expect(await agency.getBreadcrumbSchemas()).toHaveLength(1)
        })
    }

    // comidas/empresas/blog só têm BreadcrumbList (sem schema de entidade
    // próprio) — checa que não duplica e não tem null literal, igual às demais.
    const genericEntities = [
        { pathPrefix: 'comidas', items: KNOWN_FOODS, kind: 'comida' },
        { pathPrefix: 'empresas', items: KNOWN_COMPANIES, kind: 'empresa' },
        { pathPrefix: 'blog', items: KNOWN_BLOG_POSTS, kind: 'post' },
    ] as const
    for (const { pathPrefix, items, kind } of genericEntities) {
        for (const { slug, label } of items) {
            test(`${kind} ${label} emite exatamente 1 BreadcrumbList, sem null literal`, async ({ page }) => {
                const detail = new GenericDetailPage(page, pathPrefix, slug)
                await detail.open()
                expect(await detail.getJsonLdByType('BreadcrumbList')).toHaveLength(1)
                const blocks = await detail.getJsonLdBlocks()
                for (const block of blocks) {
                    expect(BasePage.containsLiteralNull(block), `bloco ${block['@type']} não deveria ter null literal`).toBe(false)
                }
            })
        }
    }
})

test.describe('SEO — canonical', () => {
    test('listagem sem filtro tem canonical limpo (sem query string)', async ({ page }) => {
        const listing = new ListingPage(page, 'productions')
        await listing.open()
        expect(await listing.getCanonical()).toBe('https://www.example.com/productions')
    })

    // Regressão: canonical fixo em /productions?genre=X apontava sempre pra
    // /productions (sem o filtro), gerando "canonical alternativa" no GSC
    // (797 páginas) — corrigido em 2026-07-03.
    test('listagem filtrada por gênero com guia único aponta canonical pro guia', async ({ page }) => {
        const listing = new ListingPage(page, 'productions')
        await listing.open(`?genre=${GENRE_WITH_UNIQUE_HUB}`)
        expect(await listing.getCanonical()).toContain('/guias/')
    })

    for (const { slug, label } of KNOWN_PRODUCTIONS) {
        test(`produção ${label} tem canonical próprio (não o da listagem)`, async ({ page }) => {
            const production = new ProductionPage(page, slug)
            await production.open()
            expect(await production.getCanonical()).toBe(`https://www.example.com/productions/${slug}`)
        })
    }
})

test.describe('ads.txt (AdSense)', () => {
    // Regressão: AdSense mostrou "não encontrado" para cms.example.com mesmo
    // com o arquivo presente e correto — a causa real era só o crawler do
    // Google ainda não ter revisitado desde a última atualização do arquivo,
    // mas a investigação confirmou (curl como Googlebot) que o fluxo real de
    // produção é: apex (com ou sem https) -> 308 -> www -> 200. Esse teste
    // trava esse contrato pra nunca mais precisar reinvestigar manualmente:
    // se algum dia o redirect virar loop, quebrar o content-type, ou o
    // conteúdo mudar sem querer, falha aqui em vez de silenciosamente no
    // AdSense dias depois.
    test('www.example.com/ads.txt responde 200 com o publisher ID correto', async ({ request }) => {
        const res = await request.get('https://www.example.com/ads.txt')
        expect(res.status()).toBe(200)
        expect(res.headers()['content-type']).toContain('text/plain')
        expect(await res.text()).toContain(process.env.ADSENSE_PUBLISHER ?? 'pub-')
    })

    test('domínio legado preserva o caminho e redireciona ao Portal', async ({ request }) => {
        const res = await request.get('https://cms.example.com/ads.txt', { maxRedirects: 0 })
        expect([301, 308]).toContain(res.status())
        expect(res.headers()['location']).toBe('https://www.example.com/ads.txt')

        const followed = await request.get('https://cms.example.com/ads.txt')
        expect(followed.status()).toBe(200)
        expect(await followed.text()).toContain(process.env.ADSENSE_PUBLISHER ?? 'pub-')
    })
})

test.describe('Redirects', () => {
    // Regressão: cms.example.com (sem www) respondia 200 direto, sem
    // redirect — Google podia indexar as duas variantes como conteúdo
    // duplicado mesmo com o canonical do site sempre declarando www.
    // Corrigido no Traefik (não no Next.js) — só testável contra produção
    // real, não existe proxy equivalente no `next dev` local.
    test('domínio legado redireciona para o Portal canônico', async ({ page, browserName }) => {
        test.skip(!process.env.E2E_BASE_URL, 'redirect é feito pelo Traefik, não existe em dev local')
        const res = await page.goto('http://cms.example.com/', { waitUntil: 'domcontentloaded' })
        // WebKit não expõe de forma confiável o redirectedFrom() em redirects de
        // navegação (limitação da API, não do site) — a URL final já garante que
        // o redirect aconteceu, então pulamos só essa checagem extra nesse browser.
        if (browserName !== 'webkit') {
            const chain = res!.request().redirectedFrom()
            expect(chain, 'esperava pelo menos um redirect antes de chegar na resposta final').not.toBeNull()
        }
        expect(page.url()).toMatch(/^https:\/\/www\.portal\.com\.br\//)
    })

    test('HTTP do domínio canônico usa redirect permanente e preserva a URL', async ({ request }) => {
        const res = await request.get('http://www.example.com/blog?health=1', { maxRedirects: 0 })
        expect([301, 308]).toContain(res.status())
        expect(res.headers()['location']).toBe('https://www.example.com/blog?health=1')
    })

    // Regressão: ao mesclar artistas duplicados em 2026-07-05, o slug antigo
    // virava 404 puro — bona-2 tinha 568 impressões/28d de busca real,
    // descoberto via scripts/check-search-performance.py.
    for (const { from, to } of MERGED_ARTIST_REDIRECTS) {
        test(`/artists/${from} redireciona pra /artists/${to} (artista mesclado)`, async ({ page }) => {
            const res = await page.goto(`/artists/${from}`, { waitUntil: 'domcontentloaded' })
            expect(res?.status()).toBe(200) // após seguir o redirect
            expect(page.url()).toBe(`https://www.example.com/artists/${to}`)
        })
    }
})
