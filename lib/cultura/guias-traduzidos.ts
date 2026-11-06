import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { getPosts } from '@/lib/wordpress/posts'
import type { WPPost } from '@/lib/wordpress/types'
import { versoesDoPost } from '@/lib/blog/translations'

/**
 * Posts de um idioma indexados pelo slug do original em português: é esse slug que aparece na URL pública
 * (`/en/blog/<slug-pt>`), enquanto o post traduzido tem slug próprio no WordPress. Lê até `maxPaginas` de 100.
 * Em português devolve vazio: a página usa os posts originais direto.
 */
export async function postsTraduzidosPorSlugPt(locale: Locale, maxPaginas = 3): Promise<Map<string, WPPost>> {
    const mapa = new Map<string, WPPost>()
    if (locale === DEFAULT_LOCALE) return mapa
    for (let page = 1; page <= maxPaginas; page++) {
        const r = await getPosts({ lang: locale, page, perPage: 100, includeContent: false }).catch(() => null)
        if (!r) break
        for (const p of r.items) {
            const slugPt = versoesDoPost(p.translations)[DEFAULT_LOCALE]
            if (slugPt) mapa.set(slugPt, p)
        }
        if (page * 100 >= r.total) break
    }
    return mapa
}
