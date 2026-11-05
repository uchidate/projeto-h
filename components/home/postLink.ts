import type { Locale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'

/**
 * Link de artigo da home. Fora do português a home só lista artigos com tradução
 * publicada (`carregarHome`), então o link vai à versão no idioma da página.
 */
export function postLink(slug: string, locale: Locale) {
    return { href: href('post', { slug }, locale) }
}
