import Image from 'next/image'
import Link from 'next/link'
import { getWPImage, stripHtml, getYear } from '@/lib/utils'
import { optionalAccent, type CSSVariableProperties } from '@/lib/agencies/presentation'
import type { getGroups } from '@/lib/wordpress/groups'

export function GroupCard({ group }: { group: Awaited<ReturnType<typeof getGroups>>['items'][number] }) {
    const img = getWPImage(group._embedded, group.featured_image_url)
    const gname = stripHtml(group.title.rendered)
    const debutYear = getYear(group.acf?.debut_date)
    const isActive = group.acf?.active !== false
    const groupColor = optionalAccent(group.acf?.color)
    const cardStyle: CSSVariableProperties | undefined = groupColor ? { '--gc': groupColor } : undefined
    return (
        <Link
            href={`/groups/${group.slug}`}
            prefetch={false}
            style={cardStyle}
            className="group border border-border bg-surface hover:border-foreground/20 transition-colors [border-top:2px_solid_var(--gc,var(--ac))]"
        >
            <div className="relative aspect-square overflow-hidden">
                {img ? (
                    <Image
                        src={img.src}
                        alt={gname}
                        fill
                        className="object-cover object-top group-hover:scale-[1.04] transition-transform duration-500"
                        sizes="(max-width: 640px) 50vw, 20vw"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface">
                        <span className="text-[28px] font-black text-muted/15">{gname[0]}</span>
                    </div>
                )}
                <div className={`absolute top-2 right-2 px-1.5 py-0.5 font-mono text-[8px] font-bold text-white ${isActive ? '[background:var(--gc,var(--ac))]' : 'bg-muted/60'}`}>
                    {isActive ? 'Ativo' : 'Inativo'}
                </div>
            </div>
            <div className="p-3">
                <p className="text-[13px] font-bold leading-snug group-hover:text-accent transition-colors line-clamp-2">{gname}</p>
                {group.acf?.name_hangul && (
                    <p className="font-mono text-[10px] text-muted mt-0.5">{group.acf.name_hangul}</p>
                )}
                {debutYear && (
                    <p className="font-mono text-[9px] text-muted/50 mt-1">desde {debutYear}</p>
                )}
            </div>
        </Link>
    )
}
