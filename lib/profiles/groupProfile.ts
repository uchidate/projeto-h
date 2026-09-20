import type { WPGroup } from '@/lib/wordpress/types'
import { getSocialUrl, getYear, stripHtml } from '@/lib/utils'
import { splitContentForAd } from '@/lib/utils/injectAd'
import { labelsFor } from '@/lib/i18n/labels'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'

const SITE_ACCENT = '#e91e8c'

/**
 * Ex-integrante é registrado por slug. Boa parte deles não tem ficha no CPT —
 * nesses casos o nome legível vem depois de uma barra vertical ("min-joo|Kim
 * Min-ju"); sem ela, o slug vira título. Sem esse fallback, quem não tem post
 * simplesmente sumia da página do grupo.
 *
 * O slug costuma trazer o grupo como sufixo de desambiguação (`chanmi-aoa`,
 * `navi-secret-number`) e às vezes um número — nenhum dos dois é parte do nome.
 */
export function parseFormerMembers(raw?: string[], groupSlug?: string): { slug: string; name: string }[] {
    const sufixo = groupSlug?.replace(/-/g, '')
    return (raw ?? []).map(entry => {
        const [rawSlug, nome] = entry.split('|')
        const slug = rawSlug.trim()
        if (nome?.trim()) return { slug, name: nome.trim() }

        const partes = slug.split('-')
        while (partes.length > 1 && /^\d+$/.test(partes[partes.length - 1])) partes.pop()
        // Testa de trás para a frente para pegar tanto "aoa" quanto "secret-number".
        for (let n = 3; n >= 1; n--) {
            if (partes.length <= n) continue
            if (partes.slice(-n).join('') === sufixo) { partes.splice(-n, n); break }
        }
        return { slug, name: partes.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') }
    })
}

/**
 * Formação ativa a partir dos posts carregados. O `memberCount` do modelo desconta
 * todos os ex-integrantes, inclusive os que nunca estiveram em `members` por não terem
 * ficha no CPT — o que subtrai duas vezes e some com integrantes reais da contagem.
 * Com os slugs em mão, o ativo é só quem sobrou. Sem eles, cai no valor do modelo.
 */
export function countActiveMembers(memberSlugs: string[], formerSlugs: string[], fallback: number): number {
    if (memberSlugs.length === 0) return fallback
    const ex = new Set(formerSlugs)
    return memberSlugs.filter(slug => !ex.has(slug)).length
}

export const GROUP_TYPE_LABELS: Record<string, string> = {
    girl_group: 'Girl Group',
    boy_group: 'Boy Group',
    co_ed: 'Grupo misto',
    solo: 'Artista solo',
}

export function buildGroupProfileModel(group: WPGroup, currentYear = new Date().getFullYear(), locale: Locale = DEFAULT_LOCALE) {
    const labels = labelsFor(locale)
    const name = stripHtml(group.title.rendered) || group.slug
    const acf = group.acf ?? {}
    // Sem corte adaptativo: a cauda do grupo vai para o CollapsibleProse, e recuar
    // o corte esconderia atrás de "continuar lendo" texto que hoje aparece inteiro.
    const [contentBefore, contentAfter] = splitContentForAd(group.content.rendered, 2, 400, false)
    // `members` guarda a formação histórica: quem saiu continua lá, marcado em
    // `former_member_slugs`. A contagem exibida é a de quem está ativo hoje.
    const formerEntries = parseFormerMembers(group.former_member_slugs, group.slug)
    const totalMembers = Array.isArray(acf.members) ? acf.members.length : 0
    const memberCount = Math.max(0, totalMembers - formerEntries.length)
    const year = getYear(acf.debut_date)
    const disbandYear = getYear(acf.disbandment_date)
    const accent = acf.color ?? SITE_ACCENT
    const socialEntries: { key: string; href: string; label: string }[] = []

    const socialNetworks = [
        ['instagram', acf.instagram, 'instagram', 'Instagram'],
        ['twitter', acf.twitter, 'x', 'X / Twitter'],
        ['youtube', acf.youtube, 'youtube', 'YouTube'],
        ['tiktok', acf.tiktok, 'tiktok', 'TikTok'],
        ['spotify', acf.spotify, 'spotify', 'Spotify'],
    ] as const
    for (const [key, value, network, label] of socialNetworks) {
        const href = getSocialUrl(value, network)
        if (href) socialEntries.push({ key, href, label })
    }
    if (acf.website) socialEntries.push({ key: 'website', href: acf.website, label: labels.t('officialSite') })

    const videoList: Array<{ title: string; url: string }> =
        Array.isArray(group.videos_rest) && group.videos_rest.length > 0
            ? group.videos_rest
            : Array.isArray(acf.videos) && acf.videos.length > 0
                ? acf.videos
                : acf.mv_url ? [{ title: name, url: acf.mv_url }] : []

    return {
        name,
        acf,
        contentBefore,
        contentAfter,
        memberCount,
        totalMembers,
        formerEntries,
        year,
        disbandYear,
        accent,
        yearsActive: year ? (disbandYear ?? currentYear) - year : null,
        generation: year
            ? labels.generation(year <= 2002 ? 1 : year <= 2011 ? 2 : year <= 2017 ? 3 : year <= 2022 ? 4 : 5)
            : null,
        socialEntries,
        videoList,
        hasBio: group.content.rendered.length > 10,
        hasColor: !!acf.color,
        hasFacts: (acf.curiosidades?.length ?? 0) > 0,
        hasStats: (group.stats?.length ?? 0) > 0,
        hasEditorial: !!group.editorial_analysis,
    }
}

export type GroupProfileModel = ReturnType<typeof buildGroupProfileModel>
