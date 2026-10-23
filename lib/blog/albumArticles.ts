import { stripHtml } from '@/lib/utils'
import { getPosts } from '@/lib/wordpress/posts'

type PostMinimo = { slug: string; title: { rendered: string } }

const norm = (s: string) => stripHtml(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const semQualificador = (titulo: string) => norm(titulo.replace(/[([].*$/, ''))

/**
 * Liga cada lançamento da discografia ao artigo de álbum que o cita. O `music_release` não guarda o
 * post, então o vínculo é pelo título: o do álbum (sem "(Deluxe)", "[2X]"…) precisa aparecer inteiro no
 * título do artigo, com 8+ caracteres. Títulos curtos ("Blue", "Fame") dariam falso positivo e ficam sem link.
 */
export function ligarArtigosAosAlbuns(albuns: { id: string; title: string }[], posts: PostMinimo[]): Record<string, string> {
    const ligacoes: Record<string, string> = {}
    for (const album of albuns) {
        const t = semQualificador(album.title)
        if (t.length < 8) continue
        const post = posts.find(p => ` ${norm(p.title.rendered)} `.includes(` ${t} `))
        if (post) ligacoes[album.id] = `/blog/${post.slug}`
    }
    return ligacoes
}

/** Artigos que citam o artista ou grupo, para casar com a discografia. Falha de rede = sem links. */
export async function getArtigosDeAlbum(tipo: 'artist' | 'group', slug: string): Promise<PostMinimo[]> {
    try {
        const { items } = await getPosts({ mentionsType: tipo, mentionsSlug: slug, perPage: 40, orderby: 'date', includeContent: false })
        return items
    } catch {
        return []
    }
}
