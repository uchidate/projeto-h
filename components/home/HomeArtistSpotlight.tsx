import Image from 'next/image'
import Link from 'next/link'
import type { WPArtist, WPGroup } from '@/lib/wordpress/types'
import { getWPImage, stripHtml } from '@/lib/utils'

const ROLE_PT: Record<string, string> = {
    singer: 'Cantor(a)', actor: 'Ator/Atriz', dancer: 'Dançarino(a)',
    rapper: 'Rapper', model: 'Modelo', host: 'Apresentador(a)',
}

type SpotlightItem =
    | { kind: 'artist'; data: WPArtist }
    | { kind: 'group'; data: WPGroup }

function SpotlightCard({ item }: { item: SpotlightItem }) {
    const isGroup = item.kind === 'group'
    const raw = item.data
    const name = stripHtml(raw.title.rendered)
    const image = getWPImage(raw._embedded, raw.featured_image_url)
    const href = isGroup ? `/groups/${raw.slug}` : `/artists/${raw.slug}`
    const accent = isGroup ? ((raw as WPGroup).acf?.color ?? undefined) : undefined
    const rawRole = (raw as WPArtist).acf?.roles?.[0]
    const sub = isGroup
        ? ((raw as WPGroup).acf?.debut_date?.slice(0, 4) ?? null)
        : (rawRole ? (ROLE_PT[rawRole] ?? rawRole) : null)

    return (
        <Link href={href} className="group flex shrink-0 flex-col items-center gap-2 w-[80px] sm:w-[96px] lg:w-[100px]">
            <div
                className="relative w-[68px] h-[68px] sm:w-[80px] sm:h-[80px] lg:w-[84px] lg:h-[84px] overflow-hidden rounded-full border-2 border-border bg-surface transition-colors duration-300 group-hover:border-accent"
                style={accent ? { borderColor: `${accent}60` } : undefined}
            >
                {image ? (
                    <Image
                        src={image.src}
                        alt={image.alt || name}
                        fill
                        sizes="84px"
                        className="object-cover object-top"
                    />
                ) : (
                    <div
                        className="flex h-full w-full items-center justify-center text-[20px] font-black"
                        style={accent
                            ? { background: `${accent}20`, color: `${accent}80` }
                            : { background: 'var(--color-accent)/10' }
                        }
                    >
                        {name[0]}
                    </div>
                )}
            </div>
            <div className="text-center min-w-0 w-full px-1">
                <p className="truncate text-[11px] sm:text-[12px] font-bold text-foreground group-hover:text-accent transition-colors leading-tight">
                    {name}
                </p>
                {sub && (
                    <p className="mt-0.5 font-mono text-[9px] text-muted/60 truncate">{sub}</p>
                )}
            </div>
        </Link>
    )
}

interface Props {
    artists?: WPArtist[]
    groups?: WPGroup[]
}

export function HomeArtistSpotlight({ artists = [], groups = [] }: Props) {
    if (!artists.length && !groups.length) return null

    // Intercala grupos e artistas para variedade visual
    const items: SpotlightItem[] = []
    const maxLen = Math.max(artists.length, groups.length)
    for (let i = 0; i < maxLen; i++) {
        if (groups[i]) items.push({ kind: 'group', data: groups[i] })
        if (artists[i]) items.push({ kind: 'artist', data: artists[i] })
    }
    const capped = items.slice(0, 12)

    return (
        <div className="border-t border-border bg-surface/40 px-4 py-5 sm:px-6 lg:px-10">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="font-mono text-[9px] font-black uppercase tracking-[0.16em] text-accent">● charts &amp; buzz coreano</p>
                    <h2 className="font-sans text-[14px] sm:text-[15px] font-black tracking-[-0.02em] text-foreground mt-0.5">
                        Populares na Coreia agora
                    </h2>
                    <p className="mt-0.5 text-[11px] text-muted hidden sm:block">Baseado em charts, streams e redes sociais na Coreia</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/artists" className="text-[11px] font-bold text-muted hover:text-accent transition-colors">Artistas →</Link>
                    <span className="text-muted/30">·</span>
                    <Link href="/groups" className="text-[11px] font-bold text-muted hover:text-accent transition-colors">Grupos →</Link>
                </div>
            </div>
            {/* Mobile/tablet: scroll horizontal — Desktop: 1 linha com justify-between */}
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 lg:overflow-hidden lg:gap-0 lg:justify-between">
                {capped.map((item, i) => (
                    <SpotlightCard key={`${item.kind}-${item.data.id}-${i}`} item={item} />
                ))}
            </div>
        </div>
    )
}
