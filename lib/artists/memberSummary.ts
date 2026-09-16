import type { WPArtist } from '@/lib/wordpress/types'

/**
 * Recorte do artista para client components de lista (card e votação de membros).
 *
 * Props de client component vão inteiras no payload RSC de cada página. Com a
 * ficha completa, a página do NCT carregava ~270KB de membros (capítulos,
 * citações, métricas, redes) que card e votação nunca exibem. Monte no servidor.
 */
export type MemberSummary = Pick<WPArtist, 'id' | 'slug' | 'featured_image_url' | 'blood_type'> & {
    title: { rendered: string }
    _embedded?: { 'wp:featuredmedia'?: Array<{ source_url: string; alt_text?: string }> }
    acf?: Pick<NonNullable<WPArtist['acf']>, 'name_hangul' | 'birth_date' | 'death_date' | 'roles' | 'height'>
}

export function toMemberSummary(member: WPArtist): MemberSummary {
    const media = member._embedded?.['wp:featuredmedia']?.[0]
    const acf = member.acf
    return {
        id: member.id,
        slug: member.slug,
        title: { rendered: member.title.rendered },
        featured_image_url: member.featured_image_url,
        blood_type: member.blood_type,
        ...(media ? { _embedded: { 'wp:featuredmedia': [{ source_url: media.source_url, alt_text: media.alt_text }] } } : {}),
        ...(acf ? { acf: { name_hangul: acf.name_hangul, birth_date: acf.birth_date, death_date: acf.death_date, roles: acf.roles, height: acf.height } } : {}),
    }
}
