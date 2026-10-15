import { getArtistBySlug, getArtists, getArtistsByIds } from '@/lib/wordpress/artists'
import { getGroupBySlug, getGroupsByMemberId, getRelatedGroups } from '@/lib/wordpress/groups'
import { getProductionBySlug, getProductionsByArtist, getSmartRelatedProductions } from '@/lib/wordpress/productions'
import { stripHtml } from '@/lib/utils'
import type { NoMapa } from '@/lib/mapa/tipos'

export type TipoEntidade = 'artist' | 'group' | 'production'

export interface Conexoes {
    centro: { label: string; img: string | null; href: string; tipo: TipoEntidade }
    nos: NoMapa[]
}

type Item = { slug: string; title?: { rendered?: string }; featured_image_url?: string | null }

const no = (item: Item, prefixo: string, tipo: NoMapa['tipo'], anel?: NoMapa['anel']): NoMapa => ({
    href: `${prefixo}/${item.slug}`,
    label: stripHtml(item.title?.rendered ?? ''),
    img: item.featured_image_url ?? null,
    tipo,
    ...(anel && { anel }),
})

/**
 * Vizinhos de uma entidade para o mapa que se recentra ao clique. Mesmas regras do mapa
 * renderizado no servidor: só vínculos confirmados (integrantes, elenco) e, de fora,
 * grupos da mesma agência ainda ativos. `null` quando a entidade não existe.
 */
export async function getConexoes(tipo: TipoEntidade, slug: string): Promise<Conexoes | null> {
    if (tipo === 'artist') {
        const artista = await getArtistBySlug(slug)
        if (!artista) return null
        const [grupos, producoes] = await Promise.all([getGroupsByMemberId(artista.id), getProductionsByArtist(slug, 6)])
        const grupo = grupos[0]
        const colegas = grupo?.acf?.members?.length ? (await getArtistsByIds(grupo.acf.members)).filter(a => a.id !== artista.id) : []
        return {
            centro: { label: stripHtml(artista.title.rendered), img: artista.featured_image_url ?? null, href: `/artists/${artista.slug}`, tipo },
            nos: [
                ...(grupo ? [no(grupo, '/groups', 'grupo')] : []),
                ...colegas.slice(0, 5).map(a => no(a, '/artists', 'artista')),
                ...producoes.slice(0, 3).map(p => no(p, '/productions', 'obra')),
            ],
        }
    }
    if (tipo === 'group') {
        const grupo = await getGroupBySlug(slug)
        if (!grupo) return null
        const ids = grupo.acf?.members ?? []
        const [membros, parentes] = await Promise.all([
            ids.length ? getArtistsByIds(ids) : Promise.resolve([]),
            getRelatedGroups(grupo.id, grupo.acf?.agency ?? undefined),
        ])
        return {
            centro: { label: stripHtml(grupo.title.rendered), img: grupo.featured_image_url ?? null, href: `/groups/${grupo.slug}`, tipo },
            nos: [
                ...membros.slice(0, 7).map(a => no(a, '/artists', 'artista')),
                ...parentes.filter(g => g.acf?.active !== false && !g.acf?.disbandment_date).slice(0, 3).map(g => no(g, '/groups', 'grupo', 'fora')),
            ],
        }
    }
    const producao = await getProductionBySlug(slug)
    if (!producao) return null
    const slugs = (producao.production_cast?.length ? producao.production_cast.map(c => c.slug) : producao.artist_slugs ?? []).slice(0, 6)
    const [elenco, parecidas] = await Promise.all([
        slugs.length ? getArtists({ slug: slugs.join(','), perPage: slugs.length }).then(r => r.items) : Promise.resolve([]),
        getSmartRelatedProductions({ excludeId: producao.id, genreId: (producao.production_genre ?? [])[0], type: producao.acf?.type, castSlugs: slugs, genres: [] }),
    ])
    return {
        centro: { label: stripHtml(producao.title.rendered), img: producao.featured_image_url ?? null, href: `/productions/${producao.slug}`, tipo },
        nos: [
            ...elenco.map(a => no(a, '/artists', 'artista')),
            ...parecidas.slice(0, 3).map(p => no(p, '/productions', 'obra')),
        ],
    }
}
