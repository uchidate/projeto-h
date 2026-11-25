import type { Metadata } from 'next'
import { defaultCatalogLanguages } from '@/components/features/LocalizedCatalog'
import { exigirListagemComConteudo } from '@/lib/wordpress/client'
import { stripHtml } from '@/lib/utils'
import { notFound } from 'next/navigation'
import { getArtists, getArtistsByIds } from '@/lib/wordpress/artists'
import { getGroups, getGroupsByIds, getGroupBySlug } from '@/lib/wordpress/groups'
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
import { maisNoticiadas } from '@/lib/constants/em-alta'
import type { WPArtist } from '@/lib/wordpress/types'

export type SearchParams = Promise<{ search?: string; page?: string; role?: string; affiliation?: string; letter?: string; sortBy?: string; group?: string }>

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
    const hasFacets = Boolean(sp.search || sp.role || sp.affiliation || sp.letter || sp.sortBy || sp.group)

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
            // "Em alta" (padrão) é a relevância: acesso real ao site + fama externa.
            : sortBy === 'trending' ? 'relevance' as const
                : 'popularity' as const
    const order = sortBy === 'name' ? 'asc' as const : 'desc' as const

    // ?group=<slug>: a lista vira os integrantes do grupo (atalhos "Por grupo"). Slug desconhecido cai na lista normal.
    const slugDoGrupo = /^[a-z0-9-]{1,80}$/.test(sp.group ?? '') ? sp.group! : undefined
    const grupoBruto = slugDoGrupo ? await getGroupBySlug(slugDoGrupo).catch(() => null) : null
    const grupoFiltro = grupoBruto && (grupoBruto.acf?.members?.length ?? 0) > 0 ? (emPt ? grupoBruto : localizeEntity(grupoBruto, locale, 'group')) : null

    const [{ items: itensBrutos, total, totalPages }, letterCounts] = await Promise.all([
        grupoFiltro ? getArtistsByIds(grupoFiltro.acf!.members!).then(items => ({ items, total: items.length, totalPages: 1 })) : getArtists({
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
    const unfiltered = !sp.search && !sp.role && !affiliation && !letter && !grupoFiltro
    if (grupoFiltro && page > 1) notFound()
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

    // Faixa "Em alta agora": mais matérias nos últimos 14 dias (noticias_14d, mínimo do selo), como em /groups.
    // Até 2026-11-21 eram os seis primeiros por relevância, que é a ordem da grade, não o que o título diz.
    // O coletor de notícias busca os ~120 artistas mais relevantes (ARTIST_NEWS_MAX_ARTISTS no ops), então só
    // eles têm o campo: duas páginas de 60 por relevância cobrem o universo. Sem ninguém acima do mínimo, a faixa some.
    // 16 cards compactos (2 fileiras de 8 no desktop); eram 6 até 2026-11-25.
    const EM_ALTA_QTD = 16
    let emAlta: WPArtist[] = []
    if (unfiltered && page === 1 && sortBy === 'trending') {
        const paginas = await Promise.all([1, 2].map(p => getArtists({ ...idioma, orderby: 'relevance', order: 'desc', perPage: 60, page: p })
            .then(r => r.items).catch(() => [] as WPArtist[])))
        const pool = paginas.flat()
        emAlta = maisNoticiadas(emPt ? pool : pool.filter(a => hasLocale(a, locale)).map(a => localizeEntity(a, locale, 'artist')), EM_ALTA_QTD)
    }

    // Nome do grupo de cada artista para o cartão ("Do grupo BLACKPINK"). Falha do WP só tira essa linha.
    const idsDeGrupo = [...new Set([...items, ...emAlta].flatMap(a => (a.acf?.groups as number[] | undefined) ?? []))]
    const grupos = Object.fromEntries((await getGroupsByIds(idsDeGrupo)).map(g => [g.id, stripHtml(g.title.rendered)]))

    // Atalhos "Por grupo": os grupos mais procurados levam à página do grupo, onde estão os integrantes.
    const gruposEmAlta = (unfiltered && page === 1) || grupoFiltro
        ? (await getGroups({ ...idioma, orderby: 'relevance', perPage: 8, leve: true }).then(r => r.items).catch(() => []))
            .filter(g => emPt || hasLocale(g, locale)).map(g => (emPt ? g : localizeEntity(g, locale, 'group')))
            .map(g => ({ slug: g.slug, nome: stripHtml(g.title.rendered) }))
        : []

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
            gruposEmAlta={gruposEmAlta}
            emAlta={emAlta}
            grupoAtivo={grupoFiltro ? { slug: grupoFiltro.slug, nome: stripHtml(grupoFiltro.title.rendered) } : undefined}
        />
        </>
    )
}
