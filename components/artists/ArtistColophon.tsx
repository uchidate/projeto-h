import { intlLocale } from '@/lib/i18n/format'
import { useLocale, useTranslations } from 'next-intl'
import type { WPArtist } from '@/lib/wordpress/types'
import { formatDatePt } from '@/lib/utils'

/** Colofão — convenção de impresso que fecha a peça declarando como ela foi
 *  apurada. Só dado real: data de revisão do post e as fontes efetivamente
 *  citadas nos capítulos e métricas. Nada é estimado nem arredondado para
 *  parecer maior; sem fonte citada, o bloco não afirma nada sobre apuração. */
export function ArtistColophon({ artist, name, accent }: { artist: WPArtist; name: string; accent: string }) {
    const t = useTranslations('profile.ui')
    const locale = useLocale()
    const acf = artist.acf ?? {}

    const sourceUrls = [
        ...(acf.story_chapters ?? []).map(chapter => chapter.source_url),
        ...(acf.key_metrics ?? []).map(metric => metric.source_url),
    ].filter((url): url is string => Boolean(url))

    const outlets = new Set<string>()
    for (const url of sourceUrls) {
        try {
            outlets.add(new URL(url).hostname.replace(/^www\./, ''))
        } catch {
            // URL malformada no CMS não deve derrubar a página nem inflar a contagem
        }
    }

    const revisedAt = artist.modified ? formatDatePt(artist.modified, intlLocale(locale)) : null
    if (!revisedAt && outlets.size === 0) return null

    return (
        <section className="page-wrap py-8">
            <div className="profile-measure border-t border-border/70 pt-5">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: accent }}>
                    {t('colophon.eyebrow')}
                </p>
                <dl className="mt-3 flex flex-wrap gap-x-10 gap-y-4">
                    {revisedAt && (
                        <div>
                            <dt className="font-mono text-[9px] font-black uppercase tracking-[0.12em] text-muted">{t('colophon.revision')}</dt>
                            <dd className="mt-1 text-[14px] text-foreground/85">{revisedAt}</dd>
                        </div>
                    )}
                    {sourceUrls.length > 0 && (
                        <div>
                            <dt className="font-mono text-[9px] font-black uppercase tracking-[0.12em] text-muted">{t('colophon.sources')}</dt>
                            <dd className="mt-1 text-[14px] text-foreground/85">
                                {t('colophon.references', { count: sourceUrls.length })}
                                {outlets.size > 0 && ` · ${t('colophon.outlets', { count: outlets.size })}`}
                            </dd>
                        </div>
                    )}
                </dl>
                {outlets.size > 0 && (
                    <p className="mt-4 max-w-[62ch] text-[12px] leading-[1.7] text-muted">
                        {t('colophonNote', { name, outlets: [...outlets].sort().join(', ') })}
                    </p>
                )}
            </div>
        </section>
    )
}
