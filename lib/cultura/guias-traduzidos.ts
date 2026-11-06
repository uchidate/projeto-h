import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { getPosts } from '@/lib/wordpress/posts'
import type { WPPost } from '@/lib/wordpress/types'
import { versoesDoPost } from '@/lib/blog/translations'
import slugsTraduzidos from './guias-traduzidos.json'

/**
 * Slug do guia de cultura (do original, em português) → slug do post traduzido no WordPress, por idioma.
 * Existe porque o post traduzido tem slug próprio e o WordPress não busca pelo slug do original; varrer a
 * listagem não escala (693 posts em inglês e crescendo, e a página só lia os 300 mais recentes: 6 dos 33 guias).
 * Guia de cultura novo traduzido entra aqui para aparecer na página no idioma.
 */
const SLUGS = slugsTraduzidos as Partial<Record<Locale, Record<string, string>>>

/**
 * Posts traduzidos indexados pelo slug do original em português: é esse slug que aparece na URL pública
 * (`/en/blog/<slug-pt>`). Uma consulta só, pelos slugs dos guias pedidos. Em português devolve vazio.
 */
export async function postsTraduzidosPorSlugPt(locale: Locale, slugsPt: string[]): Promise<Map<string, WPPost>> {
    const mapa = new Map<string, WPPost>()
    if (locale === DEFAULT_LOCALE) return mapa
    const tabela = SLUGS[locale] ?? {}
    const slugs = Array.from(new Set(slugsPt.map(s => tabela[s]).filter((s): s is string => !!s)))
    if (slugs.length === 0) return mapa
    const r = await getPosts({ lang: locale, slug: slugs.join(','), perPage: Math.min(100, slugs.length), includeContent: false }).catch(() => null)
    for (const p of r?.items ?? []) {
        const slugPt = versoesDoPost(p.translations)[DEFAULT_LOCALE]
        if (slugPt) mapa.set(slugPt, p)
    }
    return mapa
}
