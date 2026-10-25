import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import type { HomeSettings } from '@/lib/wordpress/site-settings'

/** Faixa de assuntos logo abaixo do menu: os mesmos seis atalhos dos hubs, numa linha só. */
export async function HomeAssuntos({ hubs, locale = DEFAULT_LOCALE }: { hubs: HomeSettings['hubs']; locale?: Locale }) {
    if (hubs.length === 0) return null
    const t = await getTranslations({ locale, namespace: 'home.assuntos' })
    return (
        <nav aria-label={t('rotulo')} className="border-b border-border bg-background">
            <div className="no-scrollbar flex items-center gap-5 overflow-x-auto whitespace-nowrap px-4 py-2.5 sm:px-6 lg:px-5">
                <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted">{t('rotulo')}</span>
                {hubs.map(h => (
                    <Link key={`${h.label}-${h.href}`} href={h.href} className="shrink-0 text-[12px] font-bold text-foreground transition-colors hover:text-accent">{h.label}</Link>
                ))}
            </div>
        </nav>
    )
}
