import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { SITE_URL, compartilhamento } from '@/lib/constants/site'
import { getHub, getRelatedHubs } from '@/lib/guias'
import { getHubItems } from '@/lib/guias/hub-items'
import { getPosts } from '@/lib/wordpress/posts'
import { getProductionGenres } from '@/lib/wordpress/productions'
import { getVitrineGeral } from '@/lib/wordpress/vitrine'
import { LojaEmLinha } from '@/components/ui/LojaEmLinha'
import { QuizWidget } from '@/components/ui/QuizWidget'
import { HubPageContent } from '@/components/features/HubPageContent'

export type SearchParamsGuia = Record<string, string | string[] | undefined>

export async function buildGuiaMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params
    const hub = await getHub(slug)
    if (!hub) return {}
    const url = `${SITE_URL}/guias/${slug}`
    return {
        title: hub.title,
        description: hub.description,
        keywords: hub.keywords,
        alternates: { canonical: url },
        ...compartilhamento({ titulo: hub.title, descricao: hub.description, caminho: `/guias/${slug}` }),
    }
}

/** Chaves de query que mudam o conteúdo do guia (filtros e paginação). */
export const CHAVES_FILTRO_GUIA = ['page', 'genre', 'platform', 'network', 'type', 'year'] as const

export async function GuiaPagina({ slug, sp }: { slug: string; sp: SearchParamsGuia }) {
    const hub = await getHub(slug)
    if (!hub) notFound()

    const page    = Math.max(1, Number(sp.page ?? 1) || 1)
    const genre   = typeof sp.genre    === 'string' ? sp.genre    : undefined
    const platform= typeof sp.platform === 'string' ? sp.platform : undefined
    const network = typeof sp.network  === 'string' ? sp.network  : undefined
    const type    = typeof sp.type     === 'string' ? sp.type     : undefined
    const year    = typeof sp.year     === 'string' ? Number(sp.year) || undefined : undefined

    // Guia de dorama/filme/série pede comida e K-beauty; os demais, itens de K-pop.
    const tipoVitrine = /dorama|drama|filme|serie|netflix|novela|romance|thriller|terror|comedia|acao/.test(slug) ? 'drama' : 'kpop'
    const shopProducts = await getVitrineGeral(`guia:${slug}`, 6, tipoVitrine)
    const [relatedHubs, result, { items: blogPosts }, genres] = await Promise.all([
        getRelatedHubs(hub),
        getHubItems(hub, { page, genre, platform, network, type, year }),
        getPosts({ search: hub.keywords[0], perPage: 3, includeContent: false }),
        getProductionGenres(),
    ])
    // "Comece por aqui": só na primeira página, sem filtro ativo. Sai da própria página de resultados,
    // mantendo a ordem de tendência e exigindo nota decente. Não reordena por nota: acf.rating é o
    // vote_average do TMDB sem mínimo de votos, e títulos com poucos votos chegam a 9,7.
    const semFiltro = page === 1 && !genre && !platform && !network && !type && !year
    const destaques = result.kind === 'productions' && semFiltro
        ? result.items
            .filter(p => Number(p.acf?.rating ?? 0) >= 7.5)
            .slice(0, 6)
        : []
    const genreMap = Object.fromEntries(genres.map(g => [g.id, { name: g.name, slug: g.slug }]))
    const perPage = 48
    const totalPages = Math.ceil(result.total / perPage)

    return (
        <Suspense>
            <HubPageContent
                hub={hub}
                relatedHubs={relatedHubs}
                total={result.total}
                productions={result.kind === 'productions' ? result.items : undefined}
                artists={result.kind === 'artists' ? result.items : undefined}
                groups={result.kind === 'groups' ? result.items : undefined}
                blogPosts={blogPosts}
                lojaMeio={<LojaEmLinha bloco="guia-loja-meio" products={shopProducts} title="Para quem curte k-drama e k-pop" contexto={`guia:${slug}:meio`} />}
                quiz={<QuizWidget category={tipoVitrine === 'drama' ? 'k-drama' : 'k-pop'} />}
                destaques={destaques}
                genreMap={genreMap}
                siteUrl={SITE_URL}
                page={page}
                totalPages={totalPages}
                activeFilters={{ genre, platform, network, type, year: year?.toString() }}
            />
        </Suspense>
    )
}
