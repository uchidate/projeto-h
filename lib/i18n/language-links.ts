import { createTranslator } from 'next-intl'
import { LOCALE_META, type Locale } from './config'
import { loadMessages } from './messages'
import { href, type RouteName } from './routes'
import type { LanguageLink } from '@/components/i18n/LanguageSwitcher'

/**
 * Links para as versões da página em outros idiomas, com os textos de cada
 * link já no idioma de destino (o provider do cliente só carrega o idioma atual).
 */
export async function buildLanguageLinks<R extends RouteName>(
    route: R,
    params: Parameters<typeof href<R>>[1],
    current: Locale,
    locales: readonly Locale[],
): Promise<LanguageLink[]> {
    return Promise.all(
        locales.filter((locale) => locale !== current).map(async (locale) => {
            const t = createTranslator({ locale, messages: await loadMessages(locale), namespace: 'entity.switcher' })
            return {
                locale,
                htmlLang: LOCALE_META[locale].htmlLang,
                href: (href as (r: RouteName, p: unknown, l: Locale) => string)(route, params, locale),
                name: t('name'),
                prompt: t('prompt'),
                open: t('open'),
            }
        }),
    )
}
