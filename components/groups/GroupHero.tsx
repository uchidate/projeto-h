import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { ContentStateButton } from '@/components/features/ContentStateButton'
import { ReportButton } from '@/components/ui/ReportButton'
import { labelsFor } from '@/lib/i18n/labels'
import { GroupGrainOverlay } from '@/components/groups/GroupGrainOverlay'
import { toRgba } from '@/lib/theme/color'

/* Hallmark · pre-emit critique: P4 H4 E4 S5 R4 V5
 * genre: editorial · tone: editorial-atmospheric · macrostructure: Specimen
 * hero: H2 Split diptych · theme: editorial tokens · motion: static
 */

interface GroupHeroImage {
    src: string
    alt: string
}

interface GroupHeroAcf {
    active?: boolean
    type?: string
    fandom_name?: string
    name_hangul?: string
}

interface Props {
    groupId: number
    name: string
    image: GroupHeroImage | null
    acf: GroupHeroAcf
    accent: string
    agencyName: string | null
    agencySlug?: string | null
    generation: string | null
    disbandYear: number | null
    debutYear: number | null
    yearsActive: number | null
    totalMembers?: number
}

/**
 * Hero em duas colunas: a maioria das capas oficiais de grupo é quadrada, então em vez de
 * forçar object-cover num banner panorâmico (cortando integrantes) ou letterboxar com blur,
 * a capa ganha sua própria caixa quadrada — sem corte artificial — e as informações vivem
 * num painel ao lado, não mais sobrepostas à foto.
 */
export function GroupHero({ groupId, name, image, acf, accent, agencyName, agencySlug, generation, disbandYear, debutYear, yearsActive, totalMembers }: Props) {
    const t = useTranslations('profile.ui')
    const labels = labelsFor(useLocale())
    const metaLabelClass = 'font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-featured-muted'
    const metaValueClass = 'mt-1 text-sm font-bold text-featured-fg'

    return (
        <section className="overflow-x-clip bg-featured text-featured-fg" aria-labelledby="group-profile-title">
            <div className="mx-auto grid w-full max-w-[1440px] md:min-h-128 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
                <div className="relative aspect-16/10 min-h-60 overflow-hidden bg-featured md:aspect-auto md:min-h-128">
                    {image ? (
                        <Image src={image.src} alt={image.alt || name} fill priority sizes="(max-width: 767px) 100vw, 58vw" className="object-cover object-top md:object-center" />
                    ) : (
                        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${toRgba(accent, 0.35)}, ${toRgba(accent, 0.08)})` }} />
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-featured/35 via-transparent to-transparent md:bg-linear-to-r md:from-transparent md:via-transparent md:to-featured/20" />
                    <GroupGrainOverlay opacity={0.04} />
                    <p className="absolute bottom-4 left-5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-featured-fg/75 md:bottom-6 md:left-8">
                        {t('groupProfileTag')}
                    </p>
                </div>

                <div className="relative flex flex-col justify-center overflow-hidden border-t border-featured-border px-6 py-8 sm:px-10 sm:py-10 md:border-l md:border-t-0 md:px-8 lg:px-12 lg:py-12">
                    <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(90% 75% at 100% 100%, ${toRgba(accent, 0.2)} 0%, transparent 72%)` }} />
                    {acf.name_hangul && (
                        <span aria-hidden="true" className="pointer-events-none absolute -right-3 bottom-0 select-none whitespace-nowrap font-black leading-none text-featured-fg opacity-[0.035] text-[96px] sm:text-[140px]">
                            {acf.name_hangul}
                        </span>
                    )}
                    <GroupGrainOverlay opacity={0.05} />

                    <div className="relative mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-featured-muted">
                        <span className="border border-featured-border px-2.5 py-1 text-featured-fg">
                            {disbandYear ? labels.t('groupStatus.disbandedIn', { year: disbandYear }) : acf.active ? labels.t('groupStatus.active') : labels.t('groupStatus.disbanded')}
                        </span>
                        {acf.type && <span>{labels.groupType(acf.type)}</span>}
                        {generation && <><span aria-hidden="true">/</span><span>{generation}</span></>}
                        {agencyName && (
                            agencySlug ? (
                                <Link
                                    href={`/agencies/${agencySlug}`}
                                    prefetch={false}
                                    className="inline-flex min-h-11 items-center whitespace-nowrap underline decoration-featured-border underline-offset-4 transition-colors hover:text-featured-fg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-featured-fg/70"
                                    aria-label={t('seeAgency', { agency: agencyName ?? '' })}
                                >
                                    {agencyName}
                                </Link>
                            ) : (
                                <span>{agencyName}</span>
                            )
                        )}
                    </div>

                    <h1 id="group-profile-title" className="relative min-w-0 max-w-[12ch] wrap-anywhere font-serif text-[clamp(3.25rem,7vw,5.25rem)] font-medium leading-[0.95] tracking-[-0.045em] text-featured-fg">
                        {name}
                    </h1>

                    {acf.name_hangul && acf.name_hangul !== name && (
                        <p className="relative mt-3 text-lg font-medium leading-6 tracking-[0.04em] text-featured-fg/70 sm:text-xl">
                            {acf.name_hangul}
                        </p>
                    )}

                    {acf.fandom_name && (
                        <p className="relative mt-4 max-w-[34ch] text-sm leading-6 text-featured-fg/70">
                            {t('fandomFollows')} <span className="font-bold text-featured-fg">{acf.fandom_name}</span>.
                        </p>
                    )}

                    <div className="relative mt-6 flex items-stretch gap-2">
                        <ContentStateButton
                            objectId={groupId}
                            objectType="group"
                            label={t('followGroup')}
                            activeLabel={t('following')}
                            variant="dark"
                        />
                        <ReportButton targetType="group" targetId={groupId} variant="dark" />
                    </div>

                    <dl className="relative mt-7 grid grid-cols-3 gap-4 border-t border-featured-border pt-5">
                        {debutYear && <div><dt className={metaLabelClass}>{t('debut')}</dt><dd className={metaValueClass}>{debutYear}</dd></div>}
                        {totalMembers != null && totalMembers > 0 && <div><dt className={metaLabelClass}>{t('lineup')}</dt><dd className={metaValueClass}>{t('membersCount', { count: totalMembers })}</dd></div>}
                        {yearsActive != null && yearsActive > 0 && <div><dt className={metaLabelClass}>{t('career')}</dt><dd className={metaValueClass}>{t('yearsCount', { count: yearsActive })}</dd></div>}
                    </dl>
                </div>
            </div>
        </section>
    )
}
