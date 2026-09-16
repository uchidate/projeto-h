import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { Music } from 'lucide-react'
import { BrandDot } from '@/components/ui/BrandDot'
import { ShareBar } from '@/components/ui/ShareBar'
import { AnniversaryCountdown } from '@/components/ui/AnniversaryCountdown'
import type { WPArtist, WPGroup, WPAgency } from '@/lib/wordpress/types'
import { stripHtml } from '@/lib/utils'
import { ContentStateButton } from '@/components/features/ContentStateButton'
import { EntityActionBar } from '@/components/ui/EntityActionBar'
import { ReportButton } from '@/components/ui/ReportButton'
import { GroupGrainOverlay } from '@/components/groups/GroupGrainOverlay'
import { toRgba } from '@/lib/theme/color'

interface Props {
    artist: WPArtist
    name: string
    artistUrl: string
    image: { src: string; alt?: string } | null
    roleLabels: string[]
    groups: WPGroup[]
    agency?: WPAgency
    heroMeta: string[]
    heroCopy: string | null
    quickFacts: [string, string][]
    accent: string
}

export function ArtistHero({ artist, name, artistUrl, image, roleLabels, groups, agency, heroMeta, heroCopy, quickFacts, accent }: Props) {
    const t = useTranslations('profile.ui')
    const acf = artist.acf ?? {}
    const hideTextOnMobile = image ? 'hidden sm:block' : ''
    const hideFlexOnMobile = image ? 'hidden sm:flex' : 'flex'

    return (
        <section className="page-wrap overflow-hidden py-0 sm:overflow-visible sm:py-9">
            {/* Mobile: foto com contexto editorial já na primeira dobra. sm+: grid 2 colunas */}
        {image && (
            <div className="relative -mx-4 -mt-px mb-4 h-[min(68svh,34rem)] min-h-[430px] overflow-hidden bg-black sm:hidden"
                style={{ background: 'repeating-linear-gradient(135deg, #f0f0f0 0 12px, #e8e8e8 12px 24px)' }}>
                <Image src={image.src} alt={image.alt || name} fill priority sizes="100vw" className="object-cover object-top" />
                <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(120% 100% at 100% 100%, ${toRgba(accent, 0.3)} 0%, transparent 60%)` }} />
                <GroupGrainOverlay opacity={0.05} />
                <div className="absolute inset-0 bg-linear-to-b from-black/10 via-black/10 to-black/85" />
                {acf.name_hangul && (
                    <div className="absolute left-4 top-4 bg-black/55 px-2 py-1 font-mono text-[10px] leading-none text-white backdrop-blur-xs">
                        {acf.name_hangul}
                    </div>
                )}
                <div className="absolute inset-x-0 bottom-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                    {(roleLabels.length > 0 || groups.length > 0) && (
                        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                            {roleLabels.length > 0 && (
                                <span className="font-mono text-[10px] font-bold uppercase leading-4 tracking-[0.14em] text-white/70">
                                    {roleLabels.slice(0, 3).join(' · ')}
                                </span>
                            )}
                            {groups.slice(0, 1).map(group => (
                                <Link key={group.id} href={`/groups/${group.slug}`}
                                    className="touch-target inline-flex items-center rounded-full border border-white/25 bg-white/10 px-2.5 py-1 font-mono text-[10px] font-bold leading-4 text-white backdrop-blur-xs">
                                    {stripHtml(group.title.rendered)}
                                </Link>
                            ))}
                        </div>
                    )}
                    {/* Mesmo nome do <h1> abaixo, na variante sobre a foto (mobile).
                        Ver comentário em BlogPostPage: um H1 por documento, cabeçalho
                        preservado por ARIA. */}
                    <p role="heading" aria-level={1} className="max-w-[10ch] text-[clamp(2.55rem,15vw,4.5rem)] font-black leading-[0.9] tracking-tighter text-white">
                        {name}<BrandDot />
                    </p>
                    {heroMeta.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-profile-meta font-semibold text-white/75">
                            {heroMeta.slice(0, 3).map((item, i) => (
                                <span key={i} className="inline-flex items-center gap-2">
                                    {i > 0 && <span className="text-white/30">/</span>}
                                    {item}
                                </span>
                            ))}
                        </div>
                    )}
                    {heroCopy && (
                        <p className="mt-3 line-clamp-3 max-w-[34ch] text-profile-copy font-medium text-white/80">{heroCopy}</p>
                    )}
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 py-4 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-7 sm:py-0 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-9">
                <div className="hidden sm:block relative aspect-3/4 w-full max-w-[200px] lg:max-w-[320px] mx-auto lg:mx-0 overflow-hidden"
                    style={{ background: 'repeating-linear-gradient(135deg, #f0f0f0 0 12px, #e8e8e8 12px 24px)' }}>
                    {image && (
                        <Image src={image.src} alt={image.alt || name} fill priority
                            sizes="(max-width: 640px) 248px, (max-width: 1024px) 400px, 320px"
                            className="object-cover object-top" />
                    )}
                    <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(120% 100% at 100% 100%, ${toRgba(accent, 0.22)} 0%, transparent 65%)` }} />
                    <GroupGrainOverlay opacity={0.04} />
                    {acf.name_hangul && (
                        <div className="absolute top-3.5 left-3.5 bg-foreground text-background font-mono text-[10px] px-2 py-1 leading-none">
                            {acf.name_hangul}
                        </div>
                    )}
                </div>

                <div className="relative flex flex-col min-w-0">
                    {/* Só a partir de lg: o glifo é dimensionado para o respiro do
                        desktop. Entre 640 e 1024px não há vazio à direita, então ele
                        passa por trás do chip e do nome em vez de emoldurá-los. */}
                    {acf.name_hangul && (
                        <span aria-hidden="true" className="pointer-events-none absolute -right-2 -top-4 hidden select-none whitespace-nowrap font-black leading-none text-foreground opacity-[0.05] lg:block lg:text-[140px]">
                            {acf.name_hangul}
                        </span>
                    )}
                    {/* Papéis como linha tipográfica, não pilha de chips: o nome
                        precisa ser a primeira coisa lida. Só o grupo continua
                        pill — é link e merece affordance de destino. */}
                    {(roleLabels.length > 0 || groups.length > 0) && (
                        <div className={`${hideFlexOnMobile} mb-3 flex-wrap items-center gap-x-3 gap-y-2 sm:mb-4`}>
                            {roleLabels.length > 0 && (
                                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                                    {roleLabels.join(' · ')}
                                </span>
                            )}
                            {groups.slice(0, 2).map(group => (
                                <Link key={group.id} href={`/groups/${group.slug}`}
                                    className="touch-target inline-flex items-center rounded-full border border-accent/25 bg-accent/5 px-3 py-1 font-mono text-[11px] font-bold text-accent transition-colors hover:border-accent/50 hover:bg-accent/10">
                                    {stripHtml(group.title.rendered)}
                                </Link>
                            ))}
                        </div>
                    )}

                    <h1 className={`${hideTextOnMobile} font-black tracking-[-0.04em] leading-[0.92] text-[clamp(36px,9vw,88px)]`}>
                        {name}<BrandDot />
                    </h1>

                    {/* Empilha até lg. Inline, a quebra levava o separador para o
                        início da linha seguinte ("/ Gunpo, Gyeonggi Province…") —
                        separador nunca lidera linha. Empilhado, ele nem existe. */}
                    {heroMeta.length > 0 && (
                        <div className={`${hideFlexOnMobile} mt-2 flex-col items-start gap-y-0.5 text-profile-meta font-medium text-muted lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-2 lg:gap-y-1`}>
                            {heroMeta.map((item, i) => (
                                <span key={i} className="inline-flex items-center gap-2">
                                    {i > 0 && <span className="hidden text-muted/40 lg:inline">/</span>}
                                    {item}
                                </span>
                            ))}
                        </div>
                    )}

                    {heroCopy && (
                        <p className={`${hideTextOnMobile} mt-3 max-w-[620px] text-profile-copy text-foreground/75 sm:mt-4`}>{heroCopy}</p>
                    )}

                    <EntityActionBar density="wide" className="mt-4">
                        <ContentStateButton
                            objectId={artist.id}
                            objectType="artist"
                            label={t('followArtist')}
                            activeLabel={t('following')}
                        />
                        <ShareBar url={artistUrl} title={t('onSite', { name })} />
                        <ReportButton targetType="artist" targetId={artist.id} />
                        {acf.spotify && (
                            <a href={acf.spotify as string} target="_blank" rel="noopener noreferrer"
                                className="touch-target inline-flex items-center gap-1.5 border border-green-500/30 px-3 py-1.5 font-mono text-[11px] font-semibold text-green-500 transition-colors hover:bg-green-500/10">
                                <Music size={12} /> Spotify
                            </a>
                        )}
                        {/* Contagem regressiva de aniversário de estreia não se aplica a
                            artista falecido — vinha renderizando "26 anos de estreia em N dias". */}
                        {acf.debut_date && !acf.death_date && (
                            <AnniversaryCountdown debutDate={acf.debut_date as string} groupName={name} />
                        )}
                    </EntityActionBar>

                    {quickFacts.length > 0 && (
                        <div className="mt-4 flex flex-wrap items-start gap-y-3">
                            {quickFacts.map(([k, v], i) => (
                                <div key={k} className={`min-w-[92px] ${i < quickFacts.length - 1 ? 'mr-4 border-r border-border/60 pr-4' : ''}`}>
                                    <div className="profile-kicker">{k}</div>
                                    <div className="text-[15px] font-semibold mt-1 text-foreground">{v}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {agency && (
                        <div className="mt-3 pt-3 border-t border-border/60">
                            <div className="font-mono text-[10px] text-muted uppercase tracking-[0.06em] mb-1.5">{t('agency')}</div>
                            <Link href={`/agencies/${agency.slug}`}
                                className="touch-target inline-flex items-center gap-2 text-[13px] font-semibold transition-colors hover:text-accent">
                                {agency.acf?.name_hangul && (
                                    <span className="font-mono text-[10px] text-muted">{agency.acf.name_hangul}</span>
                                )}
                                {stripHtml(agency.title.rendered)}
                            </Link>
                        </div>
                    )}

                </div>
            </div>
        </section>
    )
}
