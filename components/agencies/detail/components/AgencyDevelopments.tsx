import { useTranslations } from 'next-intl'
import { SITE_NAME } from '@/lib/constants/site'
import { intlLocale } from '@/lib/i18n/format'
import Image from 'next/image'
import { ExternalLink } from 'lucide-react'
import { stripHtml } from '@/lib/utils'
import { SectionHeader } from '@/components/agencies/detail/components/SectionHeader'
import type { AgencyView } from '@/components/agencies/detail/lib/carregarAgencia'

export function AgencyDevelopments({ view }: { view: AgencyView }) {
    const t = useTranslations('entity.agency.ui')
    const { name, businessPillars, currentDevelopments, allArtists, allGroups, currentVisualGroup, currentVisualImage } = view
    return (
        <section id="agora" className="scroll-mt-(--scroll-anchor-offset,106px)">
            <SectionHeader label={t('dev.updates')} title={t('dev.recentTitle', { name })} count={currentDevelopments.length} />
            <div className="mt-6 grid overflow-hidden border border-border bg-border lg:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)] lg:gap-px">
                <figure className="relative min-h-[360px] overflow-hidden bg-surface lg:min-h-[560px]">
                    {currentVisualImage ? (
                        <Image
                            src={currentVisualImage.src}
                            alt={t('dev.altGroup', { group: stripHtml(currentVisualGroup!.title.rendered), name })}
                            fill
                            className="object-cover object-top"
                            sizes="(max-width: 1024px) 100vw, 45vw"
                        />
                    ) : (
                        <div className="absolute inset-0 [background:var(--ac-15)]" />
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                        <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-white/60">{t('dev.scale')}</p>
                        <div className="mt-4 grid grid-cols-3 gap-px border border-white/20 bg-white/20">
                            <div className="bg-black/65 p-3 backdrop-blur-xs"><strong className="block text-2xl font-black">{allGroups.length}</strong><span className="font-mono text-[10px] uppercase tracking-wider text-white/60">{t('dev.groupsUnit')}</span></div>
                            <div className="bg-black/65 p-3 backdrop-blur-xs"><strong className="block text-2xl font-black">{allArtists.length}</strong><span className="font-mono text-[10px] uppercase tracking-wider text-white/60">{t('dev.profilesUnit')}</span></div>
                            <div className="bg-black/65 p-3 backdrop-blur-xs"><strong className="block text-2xl font-black">{businessPillars.length}</strong><span className="font-mono text-[10px] uppercase tracking-wider text-white/60">{t('dev.frontsUnit')}</span></div>
                        </div>
                        <figcaption className="mt-4 max-w-md text-[11px] leading-5 text-white/55">
                            {currentVisualGroup ? t('dev.captionWithGroup', { group: stripHtml(currentVisualGroup.title.rendered), site: SITE_NAME }) : t('dev.caption', { site: SITE_NAME })}
                        </figcaption>
                    </div>
                </figure>
                <div className="divide-y divide-border bg-background">
                {currentDevelopments.map((item, index) => {
                    const date = /^\d{4}-\d{2}-\d{2}$/.test(item.date) ? new Date(`${item.date}T00:00:00Z`) : null
                    const dateLabel = date && !Number.isNaN(date.getTime())
                        ? new Intl.DateTimeFormat(intlLocale(view.locale), { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date)
                        : item.date
                    return (
                        <article key={`${item.date}-${item.title}`} className="group relative min-h-44 overflow-hidden bg-background p-6 sm:p-7">
                            <span aria-hidden="true" className="absolute -right-3 -top-7 font-mono text-[96px] font-black leading-none text-foreground/2.5">0{index + 1}</span>
                            <div className="relative flex h-full flex-col">
                                <time dateTime={item.date} className="font-mono text-[10px] font-black uppercase tracking-[0.12em] text-(--ac)">{dateLabel}</time>
                                <h3 className="mt-5 max-w-xl text-xl font-black leading-tight tracking-tight">{item.title}</h3>
                                <p className="mt-3 text-[13px] leading-6 text-foreground/70">{item.description}</p>
                                {item.source_url && (
                                    <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center gap-1.5 pt-4 font-mono text-[10px] uppercase tracking-widest text-muted transition-colors hover:text-foreground">
                                        {t('dev.checkSource')} <ExternalLink size={10} />
                                    </a>
                                )}
                            </div>
                        </article>
                    )
                })}
                </div>
            </div>
        </section>
    )
}
