import { getRequestConfig } from 'next-intl/server'
import { getPageLocale } from './request-locale'
import { loadMessages } from './messages'

/**
 * Configuração por requisição do next-intl, sem middleware.
 *
 * Não há resolução de idioma no proxy (ver D2): o idioma chega por
 * `setPageLocale` nos layouts e pages de `app/(intl)/[locale]`. As rotas em português
 * (`app/(site)`) não chamam nada e caem no idioma padrão.
 */
export default getRequestConfig(async () => {
    // Nunca ler `requestLocale`: sem idioma definido ele cai em headers() e a
    // rota vira dinâmica. Ver ./request-locale.ts.
    const locale = getPageLocale()
    return {
        locale,
        messages: await loadMessages(locale),
        timeZone: 'America/Sao_Paulo',
    }
})
