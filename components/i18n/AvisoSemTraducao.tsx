import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/lib/i18n/config'

/**
 * Aviso das páginas que existem no idioma só pela interface (D10 em
 * docs/I18N-V2.md): o corpo é o original em português, sem versão indexável.
 */
export async function AvisoSemTraducao({ locale, hrefOriginal }: { locale: Locale; hrefOriginal: string }) {
    const t = await getTranslations({ locale, namespace: 'entity.fallback' })
    return (
        <div role="note" className="border-b border-border bg-surface px-4 py-3 text-center text-[13px] leading-5 text-foreground/80">
            <span>{t('notice')}</span>{' '}
            <a href={hrefOriginal} hrefLang="pt-BR" className="font-semibold underline underline-offset-2 hover:text-accent">{t('readOriginal')}</a>
        </div>
    )
}
