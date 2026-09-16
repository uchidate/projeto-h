import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { formatDate, slugify } from '@/lib/utils'
import { ProfileSidebarAd } from '@/components/profiles/ProfileSidebarAd'
import { labelsFor } from '@/lib/i18n/labels'
import { intlLocale } from '@/lib/i18n/format'

interface SocialEntry {
    key: string
    href: string
    label: string
}

interface GroupSidebarAcf {
    type?: string
    debut_date?: string
    disbandment_date?: string
    fandom_name?: string
    active?: boolean
    name_meaning?: string
    lightstick?: string
}

interface Props {
    acf: GroupSidebarAcf
    accent: string
    generation: string | null
    memberCount: number
    socialEntries: SocialEntry[]
    agencyName: string | null
}

export function GroupSidebarFicha({ acf, accent, generation, memberCount, socialEntries, agencyName: _agencyName }: Props) {
    const t = useTranslations('profile.ui')
    const locale = useLocale()
    const labels = labelsFor(locale)
    return (
        <aside
            aria-label={t('ficha.label')}
            className="hidden xl:flex flex-col gap-6 w-[300px] shrink-0 sticky top-[calc(var(--site-header-h)+var(--reading-bar-h,42px)+16px)]"
        >
            {/* Ficha do grupo */}
            <div className="rounded-none border border-border bg-surface p-5 space-y-4"
                style={{ borderTopColor: accent, borderTopWidth: 2 }}>
                <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">{t('ficha.title')}</p>

                {acf.type && (
                    <div>
                        <p className="font-mono text-[10px] text-muted uppercase tracking-wider font-bold">{t('ficha.type')}</p>
                        <p className="text-[14px] font-semibold text-foreground">{labels.groupType(acf.type)}</p>
                    </div>
                )}

                {acf.debut_date && (
                    <div>
                        <p className="font-mono text-[10px] text-muted uppercase tracking-wider font-bold">{t('ficha.debut')}</p>
                        <p className="text-[14px] font-semibold text-foreground">{formatDate(acf.debut_date, intlLocale(locale))}</p>
                    </div>
                )}

                {acf.disbandment_date && (
                    <div>
                        <p className="font-mono text-[10px] text-muted uppercase tracking-wider font-bold">{t('ficha.disbandment')}</p>
                        <p className="text-[14px] font-semibold text-foreground">{formatDate(acf.disbandment_date, intlLocale(locale))}</p>
                    </div>
                )}

                {memberCount > 0 && (
                    <div>
                        <p className="font-mono text-[10px] text-muted uppercase tracking-wider font-bold">{t('ficha.members')}</p>
                        <p className="text-[14px] font-semibold text-foreground">{memberCount}</p>
                    </div>
                )}

                {acf.fandom_name && (
                    <div>
                        <p className="font-mono text-[10px] text-muted uppercase tracking-wider font-bold">{t('ficha.fandom')}</p>
                        <Link href={`/fandoms/${slugify(acf.fandom_name)}`}
                            className="text-[14px] font-semibold hover:underline" style={{ color: accent }}>
                            {acf.fandom_name}
                        </Link>
                    </div>
                )}

                {acf.lightstick && (
                    <div>
                        <p className="font-mono text-[10px] text-muted uppercase tracking-wider font-bold">{t('ficha.lightstick')}</p>
                        <p className="text-[14px] font-semibold text-foreground">{acf.lightstick}</p>
                    </div>
                )}

                {acf.name_meaning && (
                    <div>
                        <p className="font-mono text-[10px] text-muted uppercase tracking-wider font-bold">{t('ficha.meaning')}</p>
                        <p className="text-[13px] text-muted leading-snug">{acf.name_meaning}</p>
                    </div>
                )}

                <div>
                    <p className="font-mono text-[10px] text-muted uppercase tracking-wider font-bold">{t('ficha.status')}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                        <span className={`w-2 h-2 rounded-full ${acf.active ? 'bg-green-500' : 'bg-muted'}`} />
                        <p className={`text-[13px] font-bold ${acf.active ? 'text-green-500' : 'text-muted'}`}>
                            {acf.active ? t('ficha.active') : t('ficha.disbanded')}
                        </p>
                    </div>
                </div>

                {generation && (
                    <div>
                        <p className="font-mono text-[10px] text-muted uppercase tracking-wider font-bold">{t('ficha.generation')}</p>
                        <p className="text-[14px] font-semibold text-foreground">{generation}</p>
                    </div>
                )}

                {socialEntries.length > 0 && (
                    <div className="pt-1 border-t border-border space-y-2">
                        {socialEntries.map(s => (
                            <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 text-[12px] font-semibold text-muted hover:text-accent transition-colors">
                                {s.label}
                                <ExternalLink size={10} className="ml-auto" />
                            </a>
                        ))}
                    </div>
                )}
            </div>

            <ProfileSidebarAd analyticsPlacement="group_profile_sidebar" />
        </aside>
    )
}
