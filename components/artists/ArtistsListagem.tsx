import type { Metadata } from 'next'
import { defaultCatalogLanguages } from '@/components/features/LocalizedCatalog'
import { exigirListagemComConteudo } from '@/lib/wordpress/client'
import { stripHtml } from '@/lib/utils'
import { notFound } from 'next/navigation'
import { getArtists } from '@/lib/wordpress/artists'
import { getGroupsByIds } from '@/lib/wordpress/groups'
import { wpFetch } from '@/lib/wordpress/client'
import { ArtistsPage } from '@/components/artists/ArtistsPage'
import { aniversariosDaSemana, hojeEmSaoPaulo, mesesDaJanela } from '@/lib/artists/aniversarios'
import { getFeaturedStoreProducts } from '@/lib/wordpress/store'
import { ordenarPrateleira } from '@/lib/wordpress/store-ranking'
import { PageBreadcrumb } from '@/components/seo/PageBreadcrumb'
import { getTranslations } from 'next-intl/server'
import { DEFAULT_LOCALE, LOCALE_META, type Locale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import { hasLocale, localizeEntity } from '@/lib/i18n/entity-translation'
import { TEXTOS_ANIVERSARIO_PT, type TextosAniversario } from '@/lib/artists/aniversarios'
import { metadataDeListagem, paginaDe, paginaInvalida, urlDaListagem } from '@/lib/listagem'

export type SearchParams = Promise<{ search?: string; page?: string; role?: string; affiliation?: string; letter?: string; sortBy?: string }>

function buildArtistsUrl(sp: { role?: string; affiliation?: string; letter?: string; page?: string }, locale: Locale = DEFAULT_LOCALE) {
    return urlDaListagem(href('artists', undefined, locale), ['role', 'affiliation', 'letter'], sp)
}

export async function metadataArtistsListagem({ searchParams, locale = DEFAULT_LOCALE }: { searchParams: SearchParams; locale?: Locale }): Promise<Metadata> {
    const sp = await searchParams
    const page = paginaDe(sp.page)
    const emPt = locale === DEFAULT_LOCALE
    const t = await getTranslations({ locale, namespace: 'client.artistsLista' })
    const url = buildArtistsUrl(sp, locale)
    const affiliation = sp.affiliation === 'group' || sp.affiliation === 'solo' ? sp.affiliation : undefined
    const { totalPages } = await getArtists({ page, perPage: 48, search: sp.search, role: sp.role, affiliation, letter: sp.letter?.toUpperCase().slice(0, 1), ...(emPt ? {} : { locale }) })
    const hasFacets = Boolean(sp.search || sp.role || sp.affiliation || sp.letter || sp.sortBy)

    return metadataDeListagem({
        titulo: t('metaTitle'),
        descricao: t('metaDescription'),
        url, page, totalPages, temFiltro: hasFacets,
        urlDaPagina: (p) => buildArtistsUrl({ ...sp, page: String(p) }, locale),
        idiomas: () => defaultCatalogLanguages('artists', locale),
    })
}

export async function ArtistsListagem({ searchParams, locale = DEFAULT_LOCALE }: { searchParams: SearchParams; locale?: Locale }) {
    const emPt = locale === DEFAULT_LOCALE
    const idioma = emPt ? {} : { locale }
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

    const [{ items: itensBrutos, total, totalPages }, letterCounts] = await Promise.all([
        getArtists({
            ...idioma,
            page,
            perPage: 48,
            search: sp.search,
            role: sp.role,
            affiliation,
            letter,
            orderby,
            order,
        }),
        // O endpoint conta só o acervo em português; no outro idioma as letras ficam todas navegáveis.
        emPt ? wpFetch<Record<string, number>>('/oc/v1/artist-letter-counts', { revalidate: 3600 }).catch(() => ({} as Record<string, number>)) : Promise.resolve({} as Record<string, number>),
    ])
    const items = emPt ? itensBrutos : itensBrutos.filter(a => hasLocale(a, locale)).map(a => localizeEntity(a, locale, 'artist'))
    // Acervo sem filtros nunca é vazio (3k+ artistas): lista vazia é falha
    // transitória do WP — lançar preserva o snapshot ISR anterior em vez de
    // cachear a listagem em branco (mesmo guard de /productions).
    const unfiltered = !sp.search && !sp.role && !affiliation && !letter
    if (emPt && unfiltered && page === 1) exigirListagemComConteudo(items, '/artists')
    if (paginaInvalida(page, totalPages)) notFound()

    // Faixa "Aniversários da semana": só na página inicial sem filtro. Falha do WP não derruba a lista.
    let aniversarios: Awaited<ReturnType<typeof aniversariosDaSemana>> = []
    if (unfiltered && page === 1) {
        const hoje = hojeEmSaoPaulo()
        const porMes = await Promise.all(mesesDaJanela(hoje).map(birthMonth =>
            getArtists({ ...idioma, birthMonth, perPage: 100, orderby: 'date', order: 'asc' }).then(r => r.items).catch(() => []),
        ))
        const tl = await getTranslations({ locale, namespace: 'client.artistsLista' })
        const textos: TextosAniversario = emPt ? TEXTOS_ANIVERSARIO_PT : {
            hoje: tl('today'), idade: tl('yearsOld'),
            meses: Array.from({ length: 12 }, (_, m) => new Intl.DateTimeFormat(LOCALE_META[locale].intl, { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, m, 1)))),
        }
        aniversarios = aniversariosDaSemana(porMes.flat().filter(a => emPt || hasLocale(a, locale)).map(a => (emPt ? a : localizeEntity(a, locale, 'artist'))), hoje, 7, 5, textos)
    }

    // Nome do grupo de cada artista para o cartão ("Do grupo BLACKPINK"). Falha do WP só tira essa linha.
    const idsDeGrupo = [...new Set(items.flatMap(a => (a.acf?.groups as number[] | undefined) ?? []))]
    const grupos = Object.fromEntries((await getGroupsByIds(idsDeGrupo)).map(g => [g.id, stripHtml(g.title.rendered)]))

    const shopProducts = emPt && unfiltered && page === 1
        ? ordenarPrateleira(await getFeaturedStoreProducts(8, 'kpop'), 'listagem:artistas')
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
            grupos={grupos}
        />
        </>
    )
}
