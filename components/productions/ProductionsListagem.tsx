import type { Metadata } from 'next'
import { linksDePaginacao, paginaDe, paginaInvalida, robotsDaListagem, urlDaListagem } from '@/lib/listagem'
import { defaultCatalogLanguages } from '@/components/features/LocalizedCatalog'
import { notFound } from 'next/navigation'
import { getProductions, getProductionGenres, getProductionPlatforms } from '@/lib/wordpress/productions'
import { SITE_URL, baseOG, baseTwitter } from '@/lib/constants/site'
import { getSingleGenreHubSlug } from '@/lib/guias/hub-lookup'
import { ProductionsPage } from '@/components/productions/ProductionsPage'
import { getFeaturedStoreProducts } from '@/lib/wordpress/store'
import { ordenarPrateleira } from '@/lib/wordpress/store-ranking'
import { PageBreadcrumb } from '@/components/seo/PageBreadcrumb'
import { getTranslations } from 'next-intl/server'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { hasLocale, localizeEntity } from '@/lib/i18n/entity-translation'
import { generosNoIdioma } from '@/lib/productions/generos'

export type SearchParams = Promise<{ genre?: string; platform?: string; type?: string; order?: string; page?: string; search?: string }>

const PRODUCTION_TYPES = ['drama', 'movie', 'special', 'variety'] as const

function parseProductionType(value?: string) {
    return PRODUCTION_TYPES.find(type => type === value)
}

type OrderParam = { orderby: 'trending_score' | 'date' | 'title'; order: 'desc' | 'asc' }
function parseOrder(value?: string): OrderParam {
    if (value === 'recent') return { orderby: 'date', order: 'desc' }
    if (value === 'az') return { orderby: 'date', order: 'asc' }
    return { orderby: 'trending_score', order: 'desc' }
}

function buildProductionsUrl(sp: { genre?: string; platform?: string; type?: string; page?: string }, locale: Locale = DEFAULT_LOCALE) {
    return urlDaListagem(href('productions', undefined, locale), ['genre', 'platform', 'type'], sp)
}

export async function metadataProductionsListagem({ searchParams, locale = DEFAULT_LOCALE }: { searchParams: SearchParams; locale?: Locale }): Promise<Metadata> {
    const sp = await searchParams
    const page = paginaDe(sp.page)
    const emPt = locale === DEFAULT_LOCALE
    const t = await getTranslations({ locale, namespace: 'client.productionsLista' })

    // Filtro puro de gênero (sem platform/type/page combinados) com guia editorial
    // equivalente: aponta o canonical para o guia em vez de auto-referenciar, pra
    // não competir com a página editorial mais rica pela mesma intenção de busca.
    const isPureGenreFilter = sp.genre && !sp.platform && !sp.type && (!sp.page || sp.page === '1')
    const hubSlug = emPt && isPureGenreFilter ? getSingleGenreHubSlug(sp.genre!) : undefined
    const url = hubSlug ? `${SITE_URL}/guias/${hubSlug}` : buildProductionsUrl(sp, locale)

    const { totalPages } = hubSlug
        ? { totalPages: 1 }
        : await getProductions({ page, perPage: 24, genre: sp.genre, platform: sp.platform, type: parseProductionType(sp.type), search: sp.search, excludeAdult: true, ...(emPt ? {} : { locale }) })
    const hasFacets = Boolean(sp.search || sp.genre || sp.platform || sp.type || sp.order)
    const invalidPage = paginaInvalida(page, totalPages)

    const languages = emPt && page === 1 && !hasFacets ? await defaultCatalogLanguages('productions') : undefined

    return {
        title: t('metaTitle'),
        description: t('metaDescription'),
        alternates: {
            canonical: url,
            ...(languages ? { languages } : {}),
            ...linksDePaginacao({ page, totalPages, ativa: !hubSlug, urlDaPagina: (p) => buildProductionsUrl({ ...sp, page: String(p) }, locale) }),
        },
        ...robotsDaListagem(hasFacets || invalidPage),
        openGraph: baseOG(url),
        twitter: baseTwitter(),
    }
}

export async function ProductionsListagem({ searchParams, locale = DEFAULT_LOCALE }: { searchParams: SearchParams; locale?: Locale }) {
    const emPt = locale === DEFAULT_LOCALE
    const idioma = emPt ? {} : { locale }
    const sp = await searchParams
    const page = paginaDe(sp.page)
    const type = parseProductionType(sp.type)
    const { orderby, order } = parseOrder(sp.order)

    const [resultadoBruto, generosBrutos, platforms] = await Promise.all([
        getProductions({
            ...idioma,
            page,
            perPage: 24,
            genre: sp.genre,
            platform: sp.platform,
            type,
            search: sp.search,
            orderby,
            order,
            excludeAdult: true,
        }),
        getProductionGenres(),
        getProductionPlatforms(),
    ])
    const productionsResult = emPt ? resultadoBruto : { ...resultadoBruto, items: resultadoBruto.items.filter(p => hasLocale(p, locale)).map(p => localizeEntity(p, locale, 'production')) }
    const genres = generosNoIdioma(generosBrutos, locale)
    // Catálogo sem filtros nunca é vazio (4k+ produções publicadas): lista
    // vazia aqui é falha transitória do WP que o client converte em [] —
    // lançar faz o ISR manter o snapshot anterior em vez de cachear o vazio.
    const unfiltered = !sp.genre && !sp.platform && !type && !sp.search
    if (emPt && unfiltered && page === 1 && productionsResult.items.length === 0) {
        throw new Error('Catálogo de produções retornou vazio — WP indisponível durante a regeneração')
    }
    if (paginaInvalida(page, productionsResult.totalPages)) notFound()

    // Faixas de descoberta só na página inicial sem filtro; falha aqui não derruba a lista.
    const inicio = page === 1 && !sp.genre && !sp.platform && !type && !sp.search && !sp.order
    let plataformasTop: typeof platforms = []
    let generosTop: { slug: string; nome: string; fotos: typeof productionsResult.items }[] = []
    const shopProducts = inicio && emPt
        ? ordenarPrateleira(await getFeaturedStoreProducts(8, 'drama'), 'listagem:producoes')
        : []
    if (inicio) {
        plataformasTop = [...platforms].sort((a, b) => b.count - a.count).slice(0, 6)
        const topGeneros = [...genres].sort((a, b) => b.count - a.count).slice(0, 6)
        const fotos = await Promise.all(topGeneros.map(g => getProductions({ ...idioma, genre: g.slug, perPage: 12, excludeAdult: true }).then(r => (emPt ? r.items : r.items.filter(p => hasLocale(p, locale)).map(p => localizeEntity(p, locale, 'production')))).catch(() => [])))
        // Cada pôster aparece uma vez só nas faixas de gênero (e nunca os que já estão em "Em alta"), senão Drama e Comédia mostram os mesmos.
        const usados = new Set(productionsResult.items.slice(0, 6).map(p => p.id))
        generosTop = topGeneros.map((g, i) => {
            const escolhidos = fotos[i].filter(p => !usados.has(p.id)).slice(0, 3)
            escolhidos.forEach(p => usados.add(p.id))
            return { slug: g.slug, nome: g.name, fotos: escolhidos }
        }).filter(g => g.fotos.length >= 2)
    }

    return (
        <>
            <PageBreadcrumb items={[{ name: 'Produções', path: '/productions' }]} />
        <ProductionsPage
            locale={locale}
            productions={productionsResult.items}
            total={productionsResult.total}
            totalPages={productionsResult.totalPages}
            genres={genres}
            platforms={platforms}
            currentPage={page}
            currentGenre={sp.genre}
            currentPlatform={sp.platform}
            currentType={type}
            currentOrder={sp.order ?? 'trending'}
            search={sp.search}
            emAlta={inicio ? productionsResult.items.slice(0, 6) : []}
            plataformasTop={plataformasTop}
            generosTop={generosTop}
            shopProducts={shopProducts}
        />
        </>
    )
}
