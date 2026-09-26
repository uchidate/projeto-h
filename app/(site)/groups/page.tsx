import type { Metadata } from 'next'
import { defaultCatalogLanguages } from '@/components/features/LocalizedCatalog'
import { exigirListagemComConteudo } from '@/lib/wordpress/client'
import { notFound } from 'next/navigation'
import { getGroups, getAllGroups, getTrendingGroups } from '@/lib/wordpress/groups'
import { wpFetch } from '@/lib/wordpress/client'
import { SITE_URL, baseOG, baseTwitter } from '@/lib/constants/site'
import { GroupsPage } from '@/components/features/GroupsPage'
import { GENERATIONS, getGenerationBySlug, getGeneration } from '@/lib/constants/generations'
import { hojeEmSaoPaulo } from '@/lib/artists/aniversarios'
import { getYear, stripHtml } from '@/lib/utils'

export const revalidate = 600

type SearchParams = Promise<{ search?: string; page?: string; type?: string; active?: string; letter?: string; generation?: string; order?: string }>

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

function buildGroupsUrl(sp: { type?: string; active?: string; letter?: string; generation?: string; order?: string; page?: string }) {
    const ps = new URLSearchParams()
    if (sp.type) ps.set('type', sp.type)
    if (sp.active) ps.set('active', sp.active)
    if (sp.letter) ps.set('letter', sp.letter)
    if (sp.generation) ps.set('generation', sp.generation)
    if (sp.order) ps.set('order', sp.order)
    if (sp.page && sp.page !== '1') ps.set('page', sp.page)
    return `${SITE_URL}/groups${ps.toString() ? `?${ps}` : ''}`
}

// Rotas estáticas equivalentes em /groups/[slug] (TIPO_CONFIGS) — quando o
// filtro é só `type`, aponta o canonical pra lá em vez de self-referenciar,
// pra não competir pela mesma busca com a página dedicada.
const TYPE_TO_STATIC_SLUG: Record<string, string> = {
    girl_group: 'girl-groups',
    boy_group: 'boy-groups',
    co_ed: 'grupos-mistos',
    solo: 'solos',
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
    const sp = await searchParams
    const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)
    const isPureTypeFilter = sp.type && !sp.active && !sp.letter && !sp.generation && !sp.order && (!sp.page || sp.page === '1')
    const staticSlug = isPureTypeFilter ? TYPE_TO_STATIC_SLUG[sp.type!] : undefined
    const url = staticSlug ? `${SITE_URL}/groups/${staticSlug}` : buildGroupsUrl(sp)

    const validTypes = ['girl_group', 'boy_group', 'co_ed', 'solo'] as const
    const type = validTypes.includes(sp.type as never) ? sp.type as typeof validTypes[number] : undefined
    const activeFilter = sp.active === 'true' ? true : sp.active === 'false' ? false : undefined
    const generation = getGenerationBySlug(sp.generation)
    const { totalPages } = staticSlug
        ? { totalPages: 1 }
        : await getGroups({
            page, perPage: 48, search: sp.search, type, active: activeFilter,
            letter: sp.letter?.toUpperCase().slice(0, 1),
            debutMin: generation ? `${generation.min}0101` : undefined,
            debutMax: generation ? `${generation.max}1231` : undefined,
        })
    const hasFacets = Boolean(sp.search || sp.type || sp.active || sp.letter || sp.generation || sp.order)
    const invalidPage = page > Math.max(1, totalPages)

    const languages = page === 1 && !hasFacets ? await defaultCatalogLanguages('groups') : undefined

    return {
        title: 'Grupos K-Pop',
        description: 'Conheça todos os grupos K-Pop — integrantes, discografia, curiosidades e mais, em português.',
        alternates: {
            canonical: url,
            ...(languages ? { languages } : {}),
            ...(!staticSlug && page > 1 ? { prev: buildGroupsUrl({ ...sp, page: String(page - 1) }) } : {}),
            ...(!staticSlug && page < totalPages ? { next: buildGroupsUrl({ ...sp, page: String(page + 1) }) } : {}),
        },
        ...(hasFacets || invalidPage ? { robots: { index: false, follow: true } } : {}),
        openGraph: baseOG(url),
        twitter: baseTwitter(),
    }
}

export default async function GroupsListPage({ searchParams }: { searchParams: SearchParams }) {
    const sp = await searchParams
    const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)
    const letter = sp.letter?.toUpperCase().slice(0, 1)
    const activeFilter = sp.active === 'true' ? true : sp.active === 'false' ? false : undefined
    const validTypes = ['girl_group', 'boy_group', 'co_ed', 'solo'] as const
    const type = validTypes.includes(sp.type as never) ? sp.type as typeof validTypes[number] : undefined
    const generation = getGenerationBySlug(sp.generation)

    const order = sp.order === 'az' || sp.order === 'novos' ? sp.order : undefined
    const inicio = page === 1 && !sp.search && !type && activeFilter === undefined && !letter && !generation && !order

    const [{ items, total, totalPages }, letterCounts] = await Promise.all([
        getGroups({
            page,
            perPage: 48,
            search: sp.search,
            type,
            active: activeFilter,
            letter,
            debutMin: generation ? `${generation.min}0101` : undefined,
            debutMax: generation ? `${generation.max}1231` : undefined,
            orderby: order === 'az' ? 'title' : order === 'novos' ? 'date' : 'popularity',
            order: order === 'az' ? 'asc' : 'desc',
        }),
        wpFetch<Record<string, number>>('/oc/v1/group-letter-counts', { revalidate: 3600 })
            .catch(() => ({} as Record<string, number>)),
    ])

    // Faixas de descoberta só na página inicial sem filtro; falha aqui não derruba a lista.
    let emAlta: typeof items = []
    let geracoes: { slug: string; label: string; fotos: typeof items }[] = []
    let debutaram: { slug: string; nome: string; dia: number; ano: number }[] = []
    const hoje = hojeEmSaoPaulo()
    if (inicio) {
        const [trending, todos] = await Promise.all([
            getTrendingGroups(6).catch(() => []),
            getAllGroups({ orderby: 'popularity', order: 'desc' }).catch(() => []),
        ])
        emAlta = trending.length >= 6 ? trending : items.slice(0, 6)
        // `todos` já vem por popularidade: as quatro primeiras de cada geração são as mais conhecidas.
        geracoes = GENERATIONS.filter(g => g.slug !== '1').map(g => ({
            slug: g.slug, label: g.label,
            fotos: todos.filter(x => getGeneration(getYear(x.acf?.debut_date))?.slug === g.slug && x.featured_image_url).slice(0, 4),
        })).filter(g => g.fotos.length >= 2)
        debutaram = todos.flatMap(g => {
            const d = String(g.acf?.debut_date ?? '').replace(/-/g, '')
            if (!/^\d{8}$/.test(d) || Number(d.slice(4, 6)) !== hoje.mes) return []
            return [{ slug: g.slug, nome: stripHtml(g.title.rendered), dia: Number(d.slice(6)), ano: Number(d.slice(0, 4)) }]
        }).sort((a, b) => a.dia - b.dia)
        // Com mais de cinco no mês, mostra os cinco a partir de hoje (e volta ao começo se acabar).
        const daqui = debutaram.filter(d => d.dia >= hoje.dia)
        debutaram = [...daqui, ...debutaram.filter(d => d.dia < hoje.dia)].slice(0, 5)
    }
    // Acervo sem filtros nunca é vazio (160+ grupos): lista vazia é falha
    // transitória do WP — lançar preserva o snapshot ISR anterior em vez de
    // cachear a listagem em branco (mesmo guard de /productions).
    const unfiltered = !sp.search && !type && activeFilter === undefined && !letter && !generation && !order
    if (unfiltered && page === 1) exigirListagemComConteudo(items, '/groups')
    if (page > Math.max(1, totalPages)) notFound()

    return (
        <GroupsPage
            groups={items}
            total={total}
            totalPages={totalPages}
            currentPage={page}
            search={sp.search}
            type={sp.type}
            active={sp.active}
            letter={letter}
            generation={sp.generation}
            order={order}
            letterCounts={letterCounts}
            emAlta={emAlta}
            geracoes={geracoes}
            debutaram={debutaram}
            mesNome={MESES[hoje.mes - 1]}
        />
    )
}
