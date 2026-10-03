import { getTranslations } from 'next-intl/server'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'

/** Selo "PT" dos artigos em listagens de outro idioma (o conteúdo só existe em português). */
export async function HomePtBadge({ locale }: { locale: Locale }) {
    if (locale === DEFAULT_LOCALE) return null
    const t = await getTranslations({ locale, namespace: 'entity.catalog' })
    return (
        <span className="inline-flex shrink-0 border border-border bg-surface px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-[0.12em] text-muted">{t('badge')}</span>
    )
}
