import Image from 'next/image'
import Link from 'next/link'
import { Star } from 'lucide-react'
import type { WPProduction } from '@/lib/wordpress/types'
import { getWPImage, stripHtml } from '@/lib/utils'
import { SectionTitleBar } from '@/components/ui/SectionTitleBar'

export function HomeProductionsRail({ productions }: { productions: WPProduction[] }) {
    if (!productions.length) return null
    return (
        <div className="border-t border-border px-4 py-8 sm:px-6 lg:px-10">
            <SectionTitleBar title="Doramas & Filmes" eyebrow="K-Drama & Cinema" href="/productions" linkText="ver todos →" />
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {productions.slice(0, 6).map((prod) => {
                    const image = getWPImage(prod._embedded, prod.featured_image_url)
                    const title = stripHtml(prod.title.rendered)
                    const acf = prod.acf ?? {}
                    return (
                        <Link key={prod.id} href={`/productions/${prod.slug}`} className="group flex flex-col">
                            <div className="relative aspect-2/3 overflow-hidden bg-surface mb-2">
                                {image ? (
                                    // Sem priority: o rail fica abaixo da dobra e o preload destes
                                    // pôsteres competia com a imagem LCP do hero (Lighthouse 2026-07-17)
                                    <Image src={image.src} alt={title} fill
                                        sizes="(max-width: 640px) 33vw, 120px"
                                        className="object-cover" />
                                ) : <div className="h-full bg-surface" />}
                                {acf.rating != null && (
                                    <div className="absolute bottom-2 left-2 flex items-center gap-0.5 bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-yellow-400">
                                        <Star size={8} fill="currentColor" /> {Number(acf.rating).toFixed(1)}
                                    </div>
                                )}
                            </div>
                            <p className="text-[12px] font-semibold leading-snug line-clamp-2 group-hover:text-accent transition-colors">{title}</p>
                            {acf.year && <p className="font-mono text-[10px] text-muted mt-0.5">{acf.year}</p>}
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
