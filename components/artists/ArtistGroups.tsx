import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import type { WPGroup } from '@/lib/wordpress/types'
import { getWPImage, stripHtml, parseAcfDate } from '@/lib/utils'
import { SectionTitleBar } from '@/components/ui/SectionTitleBar'

interface Props {
    groups: WPGroup[]
    artistName: string
    label: string
    accent: string
}

export function ArtistGroups({ groups, artistName, label, accent }: Props) {
    const t = useTranslations('profile.ui')
    if (!groups.length) return null
    const isSingleGroup = groups.length === 1
    return (
        <>
            <div className="mb-6 border-t pt-5 profile-measure" style={{ borderColor: `${accent}33` }}>
                <SectionTitleBar
                    eyebrow={label}
                    title={t('linkedGroups', { count: groups.length, name: artistName })}
                />
            </div>
            <p className="mb-6 max-w-[62ch] text-[0.98rem] leading-7 text-foreground-subtle">
                {t('linkedGroupsIntro')}
            </p>
            <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${isSingleGroup ? 'lg:max-w-[760px] lg:grid-cols-1' : 'profile-measure lg:grid-cols-3'}`}>
                {groups.map(group => {
                    const gImg = getWPImage(group._embedded, group.featured_image_url)
                    const gName = stripHtml(group.title.rendered)
                    const isActive = group.acf?.active !== false
                    const gDebutYear = group.acf?.debut_date ? parseAcfDate(group.acf.debut_date).getUTCFullYear() : null
                    const disbandYear = group.acf?.disbandment_date ? parseAcfDate(group.acf.disbandment_date).getUTCFullYear() : null
                    return (
                        <Link key={group.id} href={`/groups/${group.slug}`} className={`touch-target group profile-panel grid overflow-hidden transition-colors hover:border-accent/40 sm:grid-cols-[112px_minmax(0,1fr)] ${isSingleGroup ? 'lg:grid-cols-[240px_minmax(0,1fr)]' : 'lg:grid-cols-1'}`}>
                            <div className={`relative overflow-hidden bg-surface sm:aspect-square ${isSingleGroup ? 'aspect-16/10 lg:aspect-4/3' : 'aspect-16/10 lg:aspect-16/10'}`}>
                                {gImg ? (
                                    <Image src={gImg.src} alt={gName} fill
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        className="object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                                ) : (
                                    <div className="h-full flex items-center justify-center">
                                        <span className="text-[56px] font-black text-muted/25">{gName[0]}</span>
                                    </div>
                                )}
                                <div className={`absolute right-2 top-2 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold text-white ${isActive ? 'bg-accent-a11y' : 'bg-[#666]'}`}>
                                    {isActive ? t('groupActive') : t('groupInactive')}
                                </div>
                            </div>
                            <div className="p-4 sm:p-5">
                                <p className={`${isSingleGroup ? 'text-[1.35rem]' : 'text-[1rem]'} font-black leading-tight tracking-[-0.035em] transition-colors group-hover:text-accent`}>{gName}</p>
                                {group.acf?.name_hangul && (
                                    <p className="mt-1 font-mono text-[11px] text-muted">{group.acf.name_hangul}</p>
                                )}
                                {isSingleGroup && (
                                    <p className="mt-4 max-w-[34ch] text-[0.9rem] leading-6 text-foreground-subtle">
                                        {t('groupLinkIntro', { name: artistName })} </p>
                                )}
                                {gDebutYear && (
                                    <p className="profile-kicker mt-3">
                                        {gDebutYear}{disbandYear ? ` – ${disbandYear}` : ' – presente'}
                                    </p>
                                )}
                            </div>
                        </Link>
                    )
                })}
            </div>
        </>
    )
}
