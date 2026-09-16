import Image from 'next/image'
import Link from 'next/link'
import { Cake } from 'lucide-react'
import { getGroups, getGroupsByIds } from '@/lib/wordpress/groups'
import { getArtists } from '@/lib/wordpress/artists'
import { getProductions } from '@/lib/wordpress/productions'
import type { WPGroup, WPArtist } from '@/lib/wordpress/types'
import { getWPImage, stripHtml, parseAcfDate } from '@/lib/utils'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import { SectionTitleBar } from '@/components/ui/SectionTitleBar'
import type { HomeSettings, BestOfList } from '@/lib/wordpress/site-settings'

/* ── Culture guide chip (link curado, editável no WP admin) ── */
function CultureGuideChip({ guide }: { guide: BestOfList }) {
    return (
        <Link
            href={guide.href}
            className="group flex items-center gap-3 p-4 border border-border bg-background transition-colors hover:border-accent hover:bg-surface/60"
        >
            <span className="text-[22px] leading-none shrink-0" aria-hidden="true">{guide.emoji}</span>
            <span className="text-[13px] font-bold leading-snug text-foreground group-hover:text-accent transition-colors">{guide.label}</span>
        </Link>
    )
}

/* ── Group chip ── */
function GroupChip({ group, className = '' }: { group: WPGroup; className?: string }) {
    const image = getWPImage(group._embedded, group.featured_image_url)
    const name = stripHtml(group.title.rendered)
    const acf = group.acf ?? {}
    const accent = acf.color ?? undefined

    return (
        <Link
            href={`/groups/${group.slug}`}
            className={`group grid-cols-[72px_minmax(0,1fr)] overflow-hidden border border-border bg-background transition-[border-color,background-color] duration-300 hover:border-foreground/30 hover:bg-surface/60 ${className}`}
            style={accent ? { borderTopColor: accent, borderTopWidth: 2 } : undefined}
        >
            <div className="relative aspect-square overflow-hidden bg-surface">
                {image ? (
                    <Image src={image.src} alt={image.alt || name} fill className="object-cover object-top" sizes="72px" />
                ) : accent ? (
                    <div className="flex h-full items-center justify-center text-[22px] font-black"
                        style={{ background: `${accent}20`, color: `${accent}60` }}>
                        {name[0]}
                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center text-[22px] font-black bg-accent/10 text-accent/40">
                        {name[0]}
                    </div>
                )}
                {(acf.members?.length ?? 0) > 0 && (
                    <span className="absolute bottom-1.5 left-1.5 bg-black/70 px-1.5 py-0.5 font-mono text-[8px] font-bold text-white">
                        {acf.members!.length} mbr
                    </span>
                )}
                {acf.active === false && (
                    <span className="absolute top-1.5 right-1.5 bg-black/60 px-1 py-0.5 font-mono text-[7px] uppercase text-white/70">
                        encerrado
                    </span>
                )}
            </div>
            <div className="flex min-w-0 flex-col justify-center px-3 py-2">
                <p className="truncate text-[14px] font-black text-foreground transition-colors group-hover:text-accent">{name}</p>
                {acf.name_hangul && <p className="mt-0.5 font-mono text-[10px] text-muted">{acf.name_hangul}</p>}
                <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-muted/70">
                    {acf.debut_date ? acf.debut_date.slice(0, 4) : (acf.active === false ? 'Encerrado' : 'Em atividade')}
                </p>
            </div>
        </Link>
    )
}

/* ── Birthday chip ── */
function BirthdayChip({ artist, today }: { artist: WPArtist; today: number }) {
    const image = getWPImage(artist._embedded, artist.featured_image_url)
    const name = stripHtml(artist.title.rendered)
    let day: number | null = null
    try {
        if (artist.acf?.birth_date) day = parseAcfDate(artist.acf.birth_date).getUTCDate()
    } catch { /* ignore */ }
    const isToday = day === today

    return (
        <Link href={`/artists/${artist.slug}`} className="group flex flex-col items-center text-center gap-1.5">
            <div className={`relative w-14 h-14 overflow-hidden rounded-full bg-surface shrink-0 ${isToday ? 'ring-2 ring-accent ring-offset-1' : 'ring-1 ring-border'}`}>
                {image ? (
                    <Image src={image.src} alt={name} fill className="object-cover object-top" sizes="56px" />
                ) : (
                    <div className="w-full h-full bg-accent/10 flex items-center justify-center">
                        <span className="text-[18px] font-black text-accent/40">{name[0]}</span>
                    </div>
                )}
                {isToday && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                        <Cake size={10} className="text-white" />
                    </div>
                )}
            </div>
            <div className="min-w-0 w-full">
                <p className="text-[11px] font-semibold leading-tight line-clamp-2 group-hover:text-accent transition-colors">{name}</p>
                {day && <p className="font-mono text-[9px] text-muted">dia {day}</p>}
            </div>
        </Link>
    )
}

/* ── Main (Server Component) ── */
export async function HomeBelowFold({ homeSettings, cultureGuides }: { homeSettings: HomeSettings; cultureGuides: BestOfList[] }) {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const today = now.getUTCDate()

    const [groupsResult, selectedGroupsResult, productionsResult, birthdaysResult] = await Promise.allSettled([
        getGroups({ perPage: 8 }),
        homeSettings.featuredGroupIds.length
            ? getGroupsByIds(homeSettings.featuredGroupIds)
            : Promise.resolve([]),
        getProductions({ perPage: 6, orderby: 'date', order: 'desc' }),
        getArtists({ birthMonth: currentMonth, perPage: 20, orderby: 'title', order: 'asc' }),
    ])

    const automaticGroups = groupsResult.status === 'fulfilled' ? groupsResult.value.items : []
    const selectedGroups = selectedGroupsResult.status === 'fulfilled' ? selectedGroupsResult.value : []
    const groups = [...selectedGroups, ...automaticGroups]
        .filter((group, index, all) => all.findIndex(item => item.id === group.id) === index)
        .slice(0, 8)
    const productions = productionsResult.status === 'fulfilled' ? productionsResult.value.items : []
    // Artista falecido não entra na faixa de aniversariantes.
    const birthdays = (birthdaysResult.status === 'fulfilled' ? birthdaysResult.value.items : [])
        .filter(artist => !artist.acf?.death_date)

    const hasContent = cultureGuides.length > 0 || groups.length > 0 || productions.length > 0
    if (!hasContent) return null

    return (
        <div className="page-wrap space-y-10 pb-16 sm:space-y-14">
            {/* Ad leaderboard */}
            {/* auto: em mobile vira retângulo grande (rende bem mais que banner fino) */}
            {ADSENSE.slots.inline && <AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="home_below_fold" />}

            {/* Comece por aqui: cultura coreana — bloco fixo, curado no WP admin */}
            {cultureGuides.length > 0 && (
                <section>
                    <SectionTitleBar title="Comece por Aqui" eyebrow="cultura coreana 101" href="/cultura-coreana-101" linkText="ver todos →" />
                    <div className="-mx-4 grid auto-cols-[minmax(240px,78vw)] grid-flow-col gap-3 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:grid-flow-row sm:grid-cols-2 sm:px-0 lg:grid-cols-3">
                        {cultureGuides.slice(0, 6).map(g => <CultureGuideChip key={g.href} guide={g} />)}
                    </div>
                </section>
            )}

            {/* Grupos em destaque */}
            {groups.length > 0 && (
                <section>
                    <SectionTitleBar title="Grupos K-Pop" eyebrow="seleção editorial" href="/groups" linkText="ver todos →" />
                    <div className="-mx-4 grid auto-cols-[minmax(240px,78vw)] grid-flow-col gap-3 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:grid-flow-row sm:grid-cols-2 sm:px-0 lg:grid-cols-4">
                        {groups.map((g, index) => (
                            <GroupChip key={g.id} group={g} className={index >= 4 ? 'hidden sm:grid' : 'grid'} />
                        ))}
                    </div>
                </section>
            )}

            {/* Aniversariantes do mês */}
            {birthdays.length > 0 && (
                <section>
                    <SectionTitleBar
                        title={`Aniversariantes — ${['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][currentMonth - 1]}`}
                        eyebrow="nascidos este mês"
                        href="/artists/birthdays"
                        linkText="ver todos →"
                    />
                    <div className="-mx-4 grid auto-cols-[60px] grid-flow-col gap-3 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:grid-flow-row sm:grid-cols-8 sm:px-0 md:grid-cols-10">
                        {birthdays.slice(0, 10).map(a => (
                            <BirthdayChip key={a.id} artist={a} today={today} />
                        ))}
                    </div>
                </section>
            )}

        </div>
    )
}
