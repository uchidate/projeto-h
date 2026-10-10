import type { WPPost } from '@/lib/wordpress/types'
import { getPostBySlug } from '@/lib/wordpress/posts'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'

/**
 * Resolve o que `/<idioma>/blog/<slug>` serve. A URL pública usa o slug do original em
 * português (como as fichas); o post traduzido tem slug próprio no WordPress e só é
 * achado pelo campo `translations` do original.
 *
 * - `traduzido`: o slug é o do original e existe versão publicada no idioma.
 * - `redirecionar`: o slug é o antigo da tradução (URLs indexadas antes da mudança) e
 *   aponta para o slug do original.
 * - `original`: sem tradução publicada; a página mostra o português com aviso.
 */
export type PostIntl =
    | { tipo: 'traduzido'; post: WPPost }
    | { tipo: 'redirecionar'; slug: string }
    | { tipo: 'original' }

export async function resolverPostIntl(slug: string, locale: Locale): Promise<PostIntl> {
    const original = await getPostBySlug(slug)
    const slugTraduzido = original?.translations?.[locale]
    if (original && slugTraduzido) {
        const traduzido = await getPostBySlug(slugTraduzido, locale)
        if (traduzido) return { tipo: 'traduzido', post: traduzido }
    }

    // Slug antigo da tradução: leva ao slug do original, que é o canônico.
    const porSlugAntigo = await getPostBySlug(slug, locale)
    if (porSlugAntigo) {
        const slugOriginal = porSlugAntigo.translations?.[DEFAULT_LOCALE]
        if (slugOriginal && slugOriginal !== slug) return { tipo: 'redirecionar', slug: slugOriginal }
        // Tradução sem original vinculado: serve ela mesma.
        return { tipo: 'traduzido', post: porSlugAntigo }
    }

    return { tipo: 'original' }
}
