import Image from 'next/image'
import Link from 'next/link'
import type { WPProduction } from '@/lib/wordpress/types'
import { stripHtml, getWPImage } from '@/lib/utils'

interface Props {
    productions: WPProduction[]
    accent: string
}

const anoDe = (p: WPProduction) => p.acf?.year ?? (parseInt((p.acf?.release_date ?? p.date ?? '').slice(0, 4)) || 0)

/** Faixa de pôsteres das obras mais recentes, acima da lista completa (que segue inteira no HTML). */
export function ArtistObrasFaixa({ productions, accent }: Props) {
    const itens = [...productions]
        .map(p => ({ p, img: getWPImage(p._embedded, p.featured_image_url) }))
        .filter(x => x.img)
        .sort((a, b) => anoDe(b.p) - anoDe(a.p))
        .slice(0, 6)
    if (itens.length < 3) return null
    return (
        <ul className="page-wrap lg:pl-[calc(2.5rem+9.5rem+2.5rem)] -mt-2 mb-6 flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-6 sm:overflow-visible" aria-hidden="true">
            {itens.map(({ p, img }, i) => (
                <li key={p.id} className="w-[132px] shrink-0 sm:w-auto">
                    <Link href={`/productions/${p.slug}`} tabIndex={-1} className="group block">
                        <span className="relative block aspect-2/3 overflow-hidden border border-border bg-surface">
                            <Image src={img!.src} alt="" fill sizes="(min-width: 640px) 16vw, 132px" className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none" />
                            <span className="absolute left-2 top-1 font-mono text-[11px] font-black text-white drop-shadow" style={{ textShadow: `0 0 8px ${accent}` }}>{String(i + 1).padStart(2, '0')}</span>
                        </span>
                        <span className="mt-1.5 block truncate text-[12px] font-bold">{stripHtml(p.title.rendered)}</span>
                        {anoDe(p) > 0 && <span className="block font-mono text-[10px] text-muted">{anoDe(p)}</span>}
                    </Link>
                </li>
            ))}
        </ul>
    )
}
