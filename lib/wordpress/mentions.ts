import { wpBuscarOpcional, buildParams } from './client'
import { stripHtml } from '@/lib/utils'

export type MencaoAcervo =
    | { type: 'artist'; href: string; title: string; image?: string | null }
    | { type: 'group'; href: string; title: string; image?: string | null }
    | { type: 'production'; href: string; title: string; image?: string | null }
    | { type: 'food'; href: string; title: string; image?: string | null }
    | { type: 'company'; href: string; title: string; image?: string | null }

type RawItem = { id: number; slug: string; title: { rendered: string }; content: { rendered: string }; featured_image_url?: string | null }

const CPT = ['artist', 'group', 'production', 'food', 'company'] as const
type Cpt = typeof CPT[number]
const HREF_BASE: Record<Cpt, string> = {
    artist: '/artists', group: '/groups', production: '/productions', food: '/comidas', company: '/empresas',
}

function semAcento(s: string): string {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/**
 * A busca nativa do WP não filtra por relevância real (ex: "Samsung" devolveu
 * perfis sem nenhuma relação) — por isso o resultado é revalidado aqui contra
 * título+conteúdo de verdade, igual `filtrarPostsQueCitam` faz pro blog.
 */
async function buscarECitar(cpt: Cpt, nome: string, limite: number, excluirSlug?: string): Promise<RawItem[]> {
    const items = await wpBuscarOpcional<RawItem[]>(
        `/wp/v2/${cpt}${buildParams({ search: nome, per_page: limite * 4, status: 'publish', _fields: 'id,slug,title,content,featured_image_url' })}`,
        { revalidate: 1800 },
    ).catch(() => [])
    const alvo = semAcento(nome).trim()
    return items
        .filter(it => it.slug !== excluirSlug)
        .filter(it => semAcento(`${it.title.rendered} ${stripHtml(it.content.rendered)}`).includes(alvo))
        .slice(0, limite)
}

/**
 * Artista, grupo, produção, comida e empresa do acervo cujo texto realmente cita
 * o nome — fecha o laço entre a ficha atual e qualquer outra que já mencione a
 * mesma marca/prato, incluindo empresa↔comida (Nongshim↔Shin Ramyun), que levam
 * à mesma vitrine da loja dos dois lados. `excluirCpt`/`excluirSlug` evitam que a
 * própria ficha chamadora apareça como "menção" de si mesma.
 */
export async function getMencoesNoAcervo(
    nome: string,
    limitPorTipo = 3,
    opts?: { excluirCpt?: Cpt; excluirSlug?: string },
): Promise<MencaoAcervo[]> {
    if (nome.trim().length < 3) return []
    try {
        const resultados = await Promise.all(
            CPT.map(cpt => buscarECitar(cpt, nome, limitPorTipo, opts?.excluirCpt === cpt ? opts.excluirSlug : undefined)),
        )
        return CPT.flatMap((cpt, i) =>
            resultados[i].map(item => ({
                type: cpt,
                href: `${HREF_BASE[cpt]}/${item.slug}`,
                title: item.title.rendered,
                image: item.featured_image_url,
            })),
        )
    } catch {
        return []
    }
}
