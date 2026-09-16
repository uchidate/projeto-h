import Image from 'next/image'
import Link from 'next/link'
import type { WPGroup } from '@/lib/wordpress/types'
import { getWPImage, getYear, stripHtml } from '@/lib/utils'

export function FandomGroupCard({ group }: { group: WPGroup }) {
    const img = getWPImage(group._embedded, group.featured_image_url)
    const name = stripHtml(group.title.rendered)
    const acf = group.acf ?? {}
    const debutYear = getYear(acf.debut_date)
    const isActive = acf.active !== false

    return (
        <Link href={`/groups/${group.slug}`}
            className="group flex flex-col items-center text-center p-3 rounded-xl border border-border hover:border-accent transition-colors bg-background hover:bg-surface/60">
            <div className="relative w-20 h-20 mb-3 overflow-hidden rounded-full bg-surface ring-1 ring-border group-hover:ring-accent transition-colors"
                style={acf.color ? { boxShadow: `0 0 0 2px ${acf.color}22` } : undefined}>
                {img ? (
                    <Image src={img.src} alt={name} fill
                        className="object-cover group-hover:scale-[1.05] transition-transform duration-500"
                        sizes="80px" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-accent/10">
                        <span className="text-[24px] font-black text-accent/30">{name[0]}</span>
                    </div>
                )}
                {!isActive && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="font-mono text-[8px] font-bold text-white/80 uppercase">Inativo</span>
                    </div>
                )}
            </div>
            <p className="text-[13px] font-bold leading-tight group-hover:text-accent transition-colors line-clamp-2">{name}</p>
            {acf.name_hangul && (
                <p className="text-[10px] text-muted mt-0.5">{acf.name_hangul}</p>
            )}
            {debutYear && (
                <p className="font-mono text-[10px] text-muted/60 mt-1">Est. {debutYear}</p>
            )}
        </Link>
    )
}
