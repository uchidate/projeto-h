import { useLocale } from 'next-intl'
import { labelsFor } from '@/lib/i18n/labels'
import Image from 'next/image'
import Link from '@/components/i18n/LocalizedLink'
import type { WPArtist } from '@/lib/wordpress/types'
import { getWPImage, stripHtml } from '@/lib/utils'
import { GanchoArtista, destaqueDe } from '@/components/artists/lista/GanchoArtista'
import { estaEmAlta } from '@/lib/constants/em-alta'

interface Props {
    artist: WPArtist
    priority?: boolean
    sizes?: string
    aspectRatio?: string
    showRole?: boolean
    variant?: 'default' | 'catalog' | 'diretorio'
    /** Some quando a própria ordenação já comunica destaque (aba "Em alta"). */
    showTrendingBadge?: boolean
    /** Nome do grupo do artista (variante diretório): vira a linha "Do grupo X". */
    grupoNome?: string
}

function nameToGradient(name: string): string {
    let h = 0
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
    const hue = Math.abs(h) % 360
    return `linear-gradient(135deg, hsl(${hue},60%,18%) 0%, hsl(${(hue + 40) % 360},50%,12%) 100%)`
}

export function ArtistCard({ artist, priority, sizes = '(max-width: 640px) 33vw, 20vw', aspectRatio = 'aspect-3/4', showRole = true, variant = 'default', showTrendingBadge = true, grupoNome }: Props) {
    const locale = useLocale()
    const labels = labelsFor(locale)
    const image = getWPImage(artist._embedded, artist.featured_image_url)
    const name = stripHtml(artist.title.rendered)
    const roles = (artist.acf?.roles as string[] | undefined)?.map(r => labels.role(r, artist.acf?.gender)) ?? []
    const isTrending = showTrendingBadge && estaEmAlta(artist.acf?.noticias_14d)

    // Diretório: o nome é o que se lê primeiro, sobre a foto; o grupo vai em etiqueta no topo e a obra-chave do
    // dossiê desce para uma linha discreta embaixo, como motivo de clicar. Antes a obra ocupava a foto em letra
    // grande e o nome ficava pequeno fora dela: numa lista de artistas, lia-se uma lista de obras.
    if (variant === 'diretorio') {
        const destaque = destaqueDe(artist, locale)
        return (
            <Link href={`/artists/${artist.slug}`} className="group flex flex-col" data-slug={artist.slug}>
                <div className="relative aspect-3/4 overflow-hidden bg-surface">
                    {image ? (
                        <Image src={image.src} alt={image.alt || name} fill priority={priority}
                            className="object-cover object-top group-hover:scale-[1.03] transition-transform duration-500"
                            sizes={sizes} />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center" style={{ background: nameToGradient(name) }}>
                            <span className="select-none text-[64px] font-black leading-none text-white/15">
                                {artist.acf?.name_hangul?.slice(0, 2) ?? name[0]?.toUpperCase() ?? '?'}
                            </span>
                        </div>
                    )}
                    <GanchoArtista destaque={null} grupoNome={grupoNome} grupoNoTopo />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 via-60% to-transparent px-3 pb-2.5 pt-10">
                        <span className="line-clamp-2 block font-[family-name:var(--font-playfair)] text-[17px] font-bold leading-[1.1] text-white [text-shadow:0_1px_3px_rgba(0,0,0,.9)] sm:text-[18px]">{name}</span>
                    </div>
                </div>
                {destaque
                    ? <span className="mt-2 block truncate text-[12.5px] leading-tight text-muted transition-colors group-hover:text-accent"><span aria-hidden className="mr-1.5 inline-block h-1.5 w-1.5 -translate-y-px rounded-full bg-accent" />{destaque.titulo}</span>
                    : roles[0] && <span className="mt-2 block truncate font-mono text-[10px] uppercase tracking-[0.06em] text-muted">{roles[0]}</span>}
            </Link>
        )
    }

    if (variant === 'catalog') {
        return (
            <Link href={`/artists/${artist.slug}`} className="group flex flex-col">
                <div className="relative aspect-3/4 overflow-hidden bg-surface">
                    {image ? (
                        <Image src={image.src} alt={image.alt || name} fill priority={priority}
                            className="object-cover object-top group-hover:scale-[1.03] transition-transform duration-500"
                            sizes={sizes} />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center" style={{ background: nameToGradient(name) }}>
                            <span className="select-none text-[64px] font-black leading-none text-white/15">
                                {artist.acf?.name_hangul?.slice(0, 2) ?? name[0]?.toUpperCase() ?? '?'}
                            </span>
                        </div>
                    )}
                    {isTrending && (
                        <span className="absolute left-2 top-2 bg-accent-a11y px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                            ● top
                        </span>
                    )}
                </div>
                <div className="min-w-0 border-b border-border/50 pb-3 pt-2.5">
                    <div className="flex items-baseline justify-between gap-1">
                        <span className="truncate text-[13px] font-semibold leading-tight text-foreground transition-colors group-hover:text-accent">{name}</span>
                        {artist.acf?.name_hangul && <span className="shrink-0 font-mono text-[10px] text-muted">{artist.acf.name_hangul}</span>}
                    </div>
                    {showRole && roles.length > 0 && (
                        <div className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.04em] text-muted">{roles[0]}</div>
                    )}
                </div>
            </Link>
        )
    }

    return (
        <Link href={`/artists/${artist.slug}`} className="group flex flex-col items-center text-center">
            <div className={`relative w-full ${aspectRatio} overflow-hidden bg-surface mb-2`}
                style={{ background: 'repeating-linear-gradient(135deg, #f0f0f0 0 10px, #e8e8e8 10px 20px)' }}>
                {image ? (
                    <Image src={image.src} alt={image.alt || name} fill priority={priority} sizes={sizes}
                        className="object-cover object-top group-hover:scale-[1.03] transition-transform duration-500" />
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <span className="text-[32px] font-black text-accent/30">{name[0]}</span>
                    </div>
                )}
            </div>
            <p className="text-[12px] font-semibold leading-tight text-foreground group-hover:text-accent transition-colors line-clamp-2">
                {name}
            </p>
            {artist.acf?.name_hangul && (
                <p className="font-mono text-[10px] text-muted mt-0.5">{artist.acf.name_hangul}</p>
            )}
            {showRole && roles.length > 0 && (
                <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-wide text-muted/60">{roles[0]}</p>
            )}
        </Link>
    )
}
