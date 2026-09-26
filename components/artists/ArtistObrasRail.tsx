import Image from 'next/image'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import type { WPProduction } from '@/lib/wordpress/types'
import { href } from '@/lib/i18n/routes'
import { getWPImage, stripHtml } from '@/lib/utils'
import { anoDaObra } from '@/lib/artists/obrasEmDestaque'
import { toRgba } from '@/lib/theme/color'

interface Props {
    obras: WPProduction[]
    total: number
    accent: string
}

/**
 * Faixa "mais conhecido por" logo depois do topo. A busca dominante por artista é
 * "filmes e séries de X"; antes, a filmografia ficava a umas quatro telas de leitura.
 * A plataforma aparece só quando o dado existe (nunca um selo genérico "Assistir").
 */
export function ArtistObrasRail({ obras, total, accent }: Props) {
    const t = useTranslations('profile.artistB')
    const locale = useLocale()
    if (obras.length < 3) return null

    return (
        <section className="page-wrap py-8 sm:py-12" data-bloco="ficha-artista-obras-destaque">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: accent }}>{t('knownFor')}</p>
            <div className="mt-2 flex items-baseline justify-between gap-4">
                <h2 className="text-[24px] font-black leading-tight tracking-[-0.03em] sm:text-[34px]">{t('startWithWorks')}</h2>
                <Link href="#filmografia" className="touch-target inline-flex shrink-0 items-center font-mono text-[12px] font-bold text-accent hover:underline">
                    {t('seeAll', { count: total })}
                </Link>
            </div>
            <ol className="-mx-4 mt-5 flex snap-x snap-mandatory scroll-pl-4 gap-3.5 sm:scroll-pl-0 overflow-x-auto px-4 pb-2 sm:mx-0 sm:gap-5 sm:px-0">
                {obras.map((prod, i) => {
                    const img = getWPImage(prod._embedded, prod.featured_image_url)
                    const title = stripHtml(prod.title.rendered)
                    const year = anoDaObra(prod)
                    const plataforma = prod.acf?.platform
                    return (
                        <li key={prod.id} className="w-[150px] shrink-0 snap-start sm:w-[220px]">
                            <Link href={href('production', { slug: prod.slug }, locale)} data-bloco="ficha-artista-obras-destaque" data-posicao={i + 1} className="group block">
                                <div className="relative aspect-2/3 overflow-hidden bg-surface shadow-[0_18px_44px_rgba(0,0,0,0.45)]">
                                    {img && <Image src={img.src} alt={img.alt || title} fill sizes="(min-width: 640px) 220px, 150px" className="object-cover transition-transform duration-500 group-hover:scale-105" />}
                                    <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/85 to-transparent" />
                                    <span aria-hidden="true" className="absolute bottom-1 left-2.5 font-serif text-[52px] font-bold leading-none text-transparent sm:text-[76px]" style={{ WebkitTextStroke: '1.5px rgba(255,255,255,0.85)' }}>
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                    {plataforma && (
                                        <span className="absolute right-2 top-2 border bg-black/85 px-2 py-1 text-[11px] font-bold leading-none" style={{ borderColor: accent, color: accent, backgroundColor: toRgba('#000000', 0.85) }}>
                                            ▶ {plataforma}
                                        </span>
                                    )}
                                </div>
                                <p className="mt-2.5 line-clamp-2 text-[14px] font-bold leading-tight sm:text-[16px]">{title}</p>
                                {year && <p className="mt-1 font-mono text-[12px] text-muted">{year}</p>}
                            </Link>
                        </li>
                    )
                })}
            </ol>
        </section>
    )
}
