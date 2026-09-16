import type { Metadata } from 'next'
import { defaultCatalogLanguages } from '@/components/features/LocalizedCatalog'
import { exigirListagemComConteudo } from '@/lib/wordpress/client'
import { notFound } from 'next/navigation'
import { getGroups } from '@/lib/wordpress/groups'
import { wpFetch } from '@/lib/wordpress/client'
import { SITE_URL, baseOG, baseTwitter } from '@/lib/constants/site'
import { GroupsPage } from '@/components/features/GroupsPage'
import { getGenerationBySlug } from '@/lib/constants/generations'

export const revalidate = 600

type SearchParams = Promise<{ search?: string; page?: string; type?: string; active?: string; letter?: string; generation?: string }>

function buildGroupsUrl(sp: { type?: string; active?: string; letter?: string; generation?: string; page?: string }) {
    const ps = new URLSearchParams()
    if (sp.type) ps.set('type', sp.type)
    if (sp.active) ps.set('active', sp.active)
    if (sp.letter) ps.set('letter', sp.letter)
    if (sp.generation) ps.set('generation', sp.generation)
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
    const isPureTypeFilter = sp.type && !sp.active && !sp.letter && !sp.generation && (!sp.page || sp.page === '1')
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
    const hasFacets = Boolean(sp.search || sp.type || sp.active || sp.letter || sp.generation)
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
            orderby: 'popularity',
            order: 'desc',
        }),
        wpFetch<Record<string, number>>('/oc/v1/group-letter-counts', { revalidate: 3600 })
            .catch(() => ({} as Record<string, number>)),
    ])
    // Acervo sem filtros nunca é vazio (160+ grupos): lista vazia é falha
    // transitória do WP — lançar preserva o snapshot ISR anterior em vez de
    // cachear a listagem em branco (mesmo guard de /productions).
    const unfiltered = !sp.search && !type && activeFilter === undefined && !letter && !generation
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
            letterCounts={letterCounts}
        />
    )
}
