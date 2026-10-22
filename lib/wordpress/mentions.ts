import { wpBuscarOpcional, buildParams } from './client'
import { stripHtml } from '@/lib/utils'

export type MencaoAcervo =
    | { type: 'artist'; href: string; title: string; image?: string | null }
    | { type: 'group'; href: string; title: string; image?: string | null }
    | { type: 'production'; href: string; title: string; image?: string | null }

type RawItem = { id: number; slug: string; title: { rendered: string }; content: { rendered: string }; featured_image_url?: string | null }

function semAcento(s: string): string {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/**
 * A busca nativa do WP em artist/group/production não filtra por relevância real
 * (ex: "Samsung" devolveu perfis sem nenhuma relação) — por isso o resultado é
 * revalidado aqui contra título+conteúdo de verdade, igual `filtrarPostsQueCitam`
 * faz pro blog.
 */
async function buscarECitar(cpt: 'artist' | 'group' | 'production', nome: string, limite: number): Promise<RawItem[]> {
    const items = await wpBuscarOpcional<RawItem[]>(
        `/wp/v2/${cpt}${buildParams({ search: nome, per_page: limite * 4, status: 'publish', _fields: 'id,slug,title,content,featured_image_url' })}`,
        { revalidate: 1800 },
    ).catch(() => [])
    const alvo = semAcento(nome).trim()
    return items
        .filter(it => semAcento(`${it.title.rendered} ${stripHtml(it.content.rendered)}`).includes(alvo))
        .slice(0, limite)
}

/**
 * Artistas, grupos e produções do acervo cujo texto realmente cita o nome — fecha
 * o laço entre uma ficha de empresa e dossiês que já mencionam a marca.
 */
export async function getMencoesNoAcervo(nome: string, limitPorTipo = 3): Promise<MencaoAcervo[]> {
    if (nome.trim().length < 3) return []
    try {
        const [artists, groups, productions] = await Promise.all([
            buscarECitar('artist', nome, limitPorTipo),
            buscarECitar('group', nome, limitPorTipo),
            buscarECitar('production', nome, limitPorTipo),
        ])
        return [
            ...artists.map(a => ({ type: 'artist' as const, href: `/artists/${a.slug}`, title: a.title.rendered, image: a.featured_image_url })),
            ...groups.map(g => ({ type: 'group' as const, href: `/groups/${g.slug}`, title: g.title.rendered, image: g.featured_image_url })),
            ...productions.map(p => ({ type: 'production' as const, href: `/productions/${p.slug}`, title: p.title.rendered, image: p.featured_image_url })),
        ]
    } catch {
        return []
    }
}
