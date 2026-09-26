import type { Metadata } from 'next'
import { defaultCatalogLanguages } from '@/components/features/LocalizedCatalog'
import { notFound } from 'next/navigation'
import { getProductions, getProductionGenres, getProductionPlatforms } from '@/lib/wordpress/productions'
import { SITE_URL, baseOG, baseTwitter } from '@/lib/constants/site'
import { getSingleGenreHubSlug } from '@/lib/guias/hub-lookup'
import { ProductionsPage } from '@/components/features/ProductionsPage'

export const revalidate = 600

type SearchParams = Promise<{ genre?: string; platform?: string; type?: string; order?: string; page?: string; search?: string }>

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

function buildProductionsUrl(sp: { genre?: string; platform?: string; type?: string; page?: string }) {
    const ps = new URLSearchParams()
    if (sp.genre) ps.set('genre', sp.genre)
    if (sp.platform) ps.set('platform', sp.platform)
    if (sp.type) ps.set('type', sp.type)
    if (sp.page && sp.page !== '1') ps.set('page', sp.page)
    return `${SITE_URL}/productions${ps.toString() ? `?${ps}` : ''}`
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
    const sp = await searchParams
    const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)

    // Filtro puro de gênero (sem platform/type/page combinados) com guia editorial
    // equivalente: aponta o canonical para o guia em vez de auto-referenciar, pra
    // não competir com a página editorial mais rica pela mesma intenção de busca.
    const isPureGenreFilter = sp.genre && !sp.platform && !sp.type && (!sp.page || sp.page === '1')
    const hubSlug = isPureGenreFilter ? getSingleGenreHubSlug(sp.genre!) : undefined
    const url = hubSlug ? `${SITE_URL}/guias/${hubSlug}` : buildProductionsUrl(sp)

    const { totalPages } = hubSlug
        ? { totalPages: 1 }
        : await getProductions({ page, perPage: 24, genre: sp.genre, platform: sp.platform, type: parseProductionType(sp.type), search: sp.search, excludeAdult: true })
    const hasFacets = Boolean(sp.search || sp.genre || sp.platform || sp.type || sp.order)
    const invalidPage = page > Math.max(1, totalPages)

    const languages = page === 1 && !hasFacets ? await defaultCatalogLanguages('productions') : undefined

    return {
        title: 'Doramas & Filmes Coreanos',
        description: 'Catálogo completo de doramas e filmes coreanos — de romances épicos a thrillers de tirar o fôlego, tudo em português.',
        alternates: {
            canonical: url,
            ...(languages ? { languages } : {}),
            ...(!hubSlug && page > 1 ? { prev: buildProductionsUrl({ ...sp, page: String(page - 1) }) } : {}),
            ...(!hubSlug && page < totalPages ? { next: buildProductionsUrl({ ...sp, page: String(page + 1) }) } : {}),
        },
        ...(hasFacets || invalidPage ? { robots: { index: false, follow: true } } : {}),
        openGraph: baseOG(url),
        twitter: baseTwitter(),
    }
}

export default async function ProductionsListPage({ searchParams }: { searchParams: SearchParams }) {
    const sp = await searchParams
    const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)
    const type = parseProductionType(sp.type)
    const { orderby, order } = parseOrder(sp.order)

    const [productionsResult, genres, platforms] = await Promise.all([
        getProductions({
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
    // Catálogo sem filtros nunca é vazio (4k+ produções publicadas): lista
    // vazia aqui é falha transitória do WP que o client converte em [] —
    // lançar faz o ISR manter o snapshot anterior em vez de cachear o vazio.
    const unfiltered = !sp.genre && !sp.platform && !type && !sp.search
    if (unfiltered && page === 1 && productionsResult.items.length === 0) {
        throw new Error('Catálogo de produções retornou vazio — WP indisponível durante a regeneração')
    }
    if (page > Math.max(1, productionsResult.totalPages)) notFound()

    // Faixas de descoberta só na página inicial sem filtro; falha aqui não derruba a lista.
    const inicio = page === 1 && !sp.genre && !sp.platform && !type && !sp.search && !sp.order
    let plataformasTop: typeof platforms = []
    let generosTop: { slug: string; nome: string; fotos: typeof productionsResult.items }[] = []
    if (inicio) {
        plataformasTop = [...platforms].sort((a, b) => b.count - a.count).slice(0, 6)
        const topGeneros = [...genres].sort((a, b) => b.count - a.count).slice(0, 6)
        const fotos = await Promise.all(topGeneros.map(g => getProductions({ genre: g.slug, perPage: 12, excludeAdult: true }).then(r => r.items).catch(() => [])))
        // Cada pôster aparece uma vez só nas faixas de gênero (e nunca os que já estão em "Em alta"), senão Drama e Comédia mostram os mesmos.
        const usados = new Set(productionsResult.items.slice(0, 6).map(p => p.id))
        generosTop = topGeneros.map((g, i) => {
            const escolhidos = fotos[i].filter(p => !usados.has(p.id)).slice(0, 3)
            escolhidos.forEach(p => usados.add(p.id))
            return { slug: g.slug, nome: g.name, fotos: escolhidos }
        }).filter(g => g.fotos.length >= 2)
    }

    return (
        <ProductionsPage
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
        />
    )
}
