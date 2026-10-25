import type { WPPost } from '@/lib/wordpress/types'

export type ChaveEditoria = 'kpop' | 'doramas' | 'cultura'

/** Uma coluna da home: nome (mensagem), cor do tema e a categoria do WP que a alimenta. */
export type ColunaEditoria = {
    chave: ChaveEditoria
    /** slug da categoria no WP: alimenta a coluna e o "ver mais" (`/blog?category=`). */
    categoria: string
    cor: string
}

export const COLUNAS_EDITORIAS: readonly ColunaEditoria[] = [
    { chave: 'kpop', categoria: 'k-pop', cor: 'var(--home-cat-k-pop)' },
    { chave: 'doramas', categoria: 'k-drama', cor: 'var(--home-cat-k-drama)' },
    { chave: 'cultura', categoria: 'cultura', cor: 'var(--home-cat-cultura)' },
] as const

export type PostsPorEditoria = Partial<Record<ChaveEditoria, WPPost[]>>
export type EditoriaMontada = { coluna: ColunaEditoria; posts: WPPost[] }

/**
 * Monta as colunas a partir de uma lista por categoria (mais novo primeiro).
 * `usados` são as matérias que já aparecem em outra vitrine da home; uma matéria
 * entra em uma só coluna e nenhuma passa de `limite`. Coluna com menos de `minimo`
 * posts some: abertura sozinha não faz coluna.
 */
export function montarEditorias(porEditoria: PostsPorEditoria, usados: ReadonlySet<number> = new Set(), limite = 4, minimo = 2): EditoriaMontada[] {
    const vistos = new Set(usados)
    return COLUNAS_EDITORIAS
        .map(coluna => {
            const posts: WPPost[] = []
            for (const post of porEditoria[coluna.chave] ?? []) {
                if (posts.length >= limite) break
                if (vistos.has(post.id)) continue
                vistos.add(post.id)
                posts.push(post)
            }
            return { coluna, posts }
        })
        .filter(c => c.posts.length >= minimo)
}
