import type { Metadata } from 'next'
import { defaultCatalogLanguages } from '@/components/features/LocalizedCatalog'
import { exigirListagemComConteudo } from '@/lib/wordpress/client'
import { notFound } from 'next/navigation'
import { getArtists } from '@/lib/wordpress/artists'
import { wpFetch } from '@/lib/wordpress/client'
import { baseOG, baseTwitter } from '@/lib/constants/site'
import { ArtistsPage } from '@/components/features/ArtistsPage'
import { aniversariosDaSemana, hojeEmSaoPaulo, mesesDaJanela } from '@/lib/artists/aniversarios'
import { getFeaturedStoreProducts } from '@/lib/wordpress/store'
import { ordenarPrateleira } from '@/lib/wordpress/store-ranking'
import { PageBreadcrumb } from '@/components/seo/PageBreadcrumb'
import { linksDePaginacao, paginaDe, paginaInvalida, robotsDaListagem, urlDaListagem } from '@/lib/listagem'

export const revalidate = 600

type SearchParams = Promise<{ search?: string; page?: string; role?: string; affiliation?: string; letter?: string; sortBy?: string }>

function buildArtistsUrl(sp: { role?: string; affiliation?: string; letter?: string; page?: string }) {
    return urlDaListagem('/artists', ['role', 'affiliation', 'letter'], sp)
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
    const sp = await searchParams
    const page = paginaDe(sp.page)
    const url = buildArtistsUrl(sp)
    const affiliation = sp.affiliation === 'group' || sp.affiliation === 'solo' ? sp.affiliation : undefined
    const { totalPages } = await getArtists({ page, perPage: 48, search: sp.search, role: sp.role, affiliation, letter: sp.letter?.toUpperCase().slice(0, 1) })
    const hasFacets = Boolean(sp.search || sp.role || sp.affiliation || sp.letter || sp.sortBy)
    const invalidPage = paginaInvalida(page, totalPages)

    const languages = page === 1 && !hasFacets ? await defaultCatalogLanguages('artists') : undefined

    return {
        title: 'Artistas K-Pop',
        description: 'Perfis completos de artistas K-Pop — cantores, atores, idols e mais, tudo em português.',
        alternates: {
            canonical: url,
            ...(languages ? { languages } : {}),
            ...linksDePaginacao({ page, totalPages, urlDaPagina: (p) => buildArtistsUrl({ ...sp, page: String(p) }) }),
        },
        ...robotsDaListagem(hasFacets || invalidPage),
        openGraph: baseOG(url),
        twitter: baseTwitter(),
    }
}

export default async function ArtistsListPage({ searchParams }: { searchParams: SearchParams }) {
    const sp = await searchParams
    const page = paginaDe(sp.page)
    const letter = sp.letter?.toUpperCase().slice(0, 1)
    const sortBy = ['popular', 'trending', 'name', 'newest'].includes(sp.sortBy ?? '') ? sp.sortBy! : 'trending'
    const affiliation = sp.affiliation === 'group' || sp.affiliation === 'solo' ? sp.affiliation : undefined

    const orderby = sortBy === 'name' ? 'title' as const
        : sortBy === 'newest' ? 'date' as const
            : sortBy === 'trending' ? 'trending_score' as const
                : 'popularity' as const
    const order = sortBy === 'name' ? 'asc' as const : 'desc' as const

    const [{ items, total, totalPages }, letterCounts] = await Promise.all([
        getArtists({
            page,
            perPage: 48,
            search: sp.search,
            role: sp.role,
            affiliation,
            letter,
            orderby,
            order,
        }),
        wpFetch<Record<string, number>>('/oc/v1/artist-letter-counts', { revalidate: 3600 }).catch(() => ({} as Record<string, number>)),
    ])
    // Acervo sem filtros nunca é vazio (3k+ artistas): lista vazia é falha
    // transitória do WP — lançar preserva o snapshot ISR anterior em vez de
    // cachear a listagem em branco (mesmo guard de /productions).
    const unfiltered = !sp.search && !sp.role && !affiliation && !letter
    if (unfiltered && page === 1) exigirListagemComConteudo(items, '/artists')
    if (paginaInvalida(page, totalPages)) notFound()

    // Faixa "Aniversários da semana": só na página inicial sem filtro. Falha do WP não derruba a lista.
    let aniversarios: Awaited<ReturnType<typeof aniversariosDaSemana>> = []
    if (unfiltered && page === 1) {
        const hoje = hojeEmSaoPaulo()
        const porMes = await Promise.all(mesesDaJanela(hoje).map(birthMonth =>
            getArtists({ birthMonth, perPage: 100, orderby: 'date', order: 'asc' }).then(r => r.items).catch(() => []),
        ))
        aniversarios = aniversariosDaSemana(porMes.flat(), hoje)
    }

    const shopProducts = unfiltered && page === 1
        ? ordenarPrateleira(await getFeaturedStoreProducts(8), 'listagem:artistas')
        : []

    return (
        <>
            <PageBreadcrumb items={[{ name: 'Artistas', path: '/artists' }]} />
        <ArtistsPage
            artists={items}
            total={total}
            totalPages={totalPages}
            currentPage={page}
            search={sp.search}
            role={sp.role}
            affiliation={affiliation}
            letter={letter}
            sortBy={sortBy}
            letterCounts={letterCounts}
            perPage={48}
            aniversarios={aniversarios}
            shopProducts={shopProducts}
        />
        </>
    )
}
