import { getUserContentStates } from '@/lib/wordpress/userApi'
import { getArtistsByIds } from '@/lib/wordpress/artists'
import { getGroupsByIds } from '@/lib/wordpress/groups'
import { getPosts } from '@/lib/wordpress/posts'
import { getWPImage, stripHtml } from '@/lib/utils'

export interface NovidadeSeguida {
    id: number
    slug: string
    titulo: string
    imagem: string | null
    /** ISO do WordPress, para "hoje" / "ontem" no cliente. */
    data: string
    /** Quem, entre os seguidos, a matéria cita. */
    sobre: string
}

export interface Seguindo {
    nomes: string[]
    novidades: NovidadeSeguida[]
}

const MAX_SEGUIDOS = 8
const MAX_NOVIDADES = 3

/** Os últimos seguidos pelo visitante (artistas e grupos) e as matérias mais novas que os citam, sem repetir matéria. */
export async function carregarSeguindo(token: string): Promise<Seguindo> {
    const { states } = await getUserContentStates(token)
    const recentes = (tipo: 'artist' | 'group') => states
        .filter(s => s.objectType === tipo && s.state === 'following')
        .sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')))
        .map(s => s.objectId)
        .slice(0, MAX_SEGUIDOS)
    const [artistas, grupos] = await Promise.all([
        getArtistsByIds(recentes('artist')).catch(() => []),
        getGroupsByIds(recentes('group')).catch(() => []),
    ])
    const seguidos = [
        ...artistas.map(a => ({ tipo: 'artist' as const, slug: a.slug, nome: stripHtml(a.title.rendered) })),
        ...grupos.map(g => ({ tipo: 'group' as const, slug: g.slug, nome: stripHtml(g.title.rendered) })),
    ].slice(0, MAX_SEGUIDOS)
    const lidas = await Promise.allSettled(seguidos.map(s => getPosts({ mentionsType: s.tipo, mentionsSlug: s.slug, perPage: 2, includeContent: false })))
    const vistos = new Set<number>()
    const novidades: NovidadeSeguida[] = []
    lidas.forEach((r, i) => {
        if (r.status !== 'fulfilled') return
        for (const post of r.value.items) {
            if (vistos.has(post.id)) continue
            vistos.add(post.id)
            novidades.push({
                id: post.id, slug: post.slug, titulo: stripHtml(post.title.rendered), data: post.date, sobre: seguidos[i].nome,
                imagem: getWPImage(post._embedded, post.featured_image_url)?.src ?? null,
            })
        }
    })
    novidades.sort((a, b) => b.data.localeCompare(a.data))
    return { nomes: seguidos.map(s => s.nome), novidades: novidades.slice(0, MAX_NOVIDADES) }
}
