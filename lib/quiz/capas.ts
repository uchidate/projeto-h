import { getPosts } from '@/lib/wordpress/posts'

/** Categoria do quiz → categoria de artigos do blog que fornece a imagem de capa do cartão. */
const CATEGORIA_DO_BLOG: Record<string, string> = { 'k-pop': 'k-pop', 'k-drama': 'k-drama', 'cultura': 'cultura', 'historia': 'cultura' }

/** Uma imagem real do site para cada tema (a do artigo mais recente que tenha foto). Falhou ou sem foto: null, e o cartão fica só na cor. */
export async function capasDoQuiz(): Promise<Record<string, string | null>> {
    const entradas = await Promise.all(Object.entries(CATEGORIA_DO_BLOG).map(async ([tema, categoria]) => {
        try {
            const { items } = await getPosts({ category: categoria, perPage: 6, includeContent: false })
            const comFoto = items.filter(p => p.featured_image_url)
            // "história" reaproveita a categoria de cultura: pega outra foto, para não repetir a do cartão de Cultura.
            return [tema, comFoto[tema === 'historia' ? 1 : 0]?.featured_image_url ?? null] as const
        } catch { return [tema, null] as const }
    }))
    return Object.fromEntries(entradas)
}
