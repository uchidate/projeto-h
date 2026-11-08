import { SOURCE_LOCALE, type Locale } from '@/lib/i18n/config'
import { getPosts } from '@/lib/wordpress/posts'
import type { WPPost } from '@/lib/wordpress/types'
import { versoesDoPost, comCapaDoOriginal } from '@/lib/blog/translations'

/**
 * Posts traduzidos dos guias de cultura, indexados pelo slug do original em português (o slug que aparece
 * na URL pública, `/en/blog/<slug-pt>`). Sem tabela mantida à mão: o WordPress já sabe o que está traduzido.
 * O campo `translations` do post em português lista só as versões PUBLICADAS (rascunho não entra), então
 * publicar a tradução no WordPress e revalidar basta para o guia aparecer na página no idioma.
 *
 * Duas consultas, não uma por guia: os originais pelos slugs (para ler `translations[locale]`) e depois os
 * traduzidos pelos slugs achados (capa, título e resumo no idioma). Em português devolve vazio.
 */
export async function postsTraduzidosPorSlugPt(locale: Locale, slugsPt: string[]): Promise<Map<string, WPPost>> {
    const mapa = new Map<string, WPPost>()
    if (locale === SOURCE_LOCALE) return mapa
    const unicos = Array.from(new Set(slugsPt))
    if (unicos.length === 0) return mapa
    const originais = await getPosts({ slug: unicos.join(','), perPage: Math.min(100, unicos.length), includeContent: false }).catch(() => null)
    const slugPtPorTraduzido = new Map<string, string>()
    const originalPorSlugPt = new Map<string, WPPost>()
    for (const original of originais?.items ?? []) {
        const slugTraduzido = versoesDoPost(original.translations)[locale]
        if (slugTraduzido) { slugPtPorTraduzido.set(slugTraduzido, original.slug); originalPorSlugPt.set(original.slug, original) }
    }
    if (slugPtPorTraduzido.size === 0) return mapa
    const slugs = Array.from(slugPtPorTraduzido.keys())
    const r = await getPosts({ lang: locale, slug: slugs.join(','), perPage: Math.min(100, slugs.length), includeContent: false }).catch(() => null)
    for (const p of r?.items ?? []) {
        const slugPt = slugPtPorTraduzido.get(p.slug)
        if (slugPt) mapa.set(slugPt, comCapaDoOriginal(p, originalPorSlugPt.get(slugPt)))
    }
    return mapa
}
