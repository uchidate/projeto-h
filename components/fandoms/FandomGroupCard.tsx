import Image from 'next/image'
import Link from 'next/link'
import type { WPGroup } from '@/lib/wordpress/types'
import { getWPImage, getYear, stripHtml } from '@/lib/utils'

/** Cartão do grupo dentro da página da torcida: foto grande, nome, hangul e um convite para abrir a ficha. */
export function FandomGroupCard({ group, cor, tinta }: { group: WPGroup; cor: string; tinta: string }) {
    const img = getWPImage(group._embedded, group.featured_image_url)
    const name = stripHtml(group.title.rendered)
    const acf = group.acf ?? {}
    const debutYear = getYear(acf.debut_date)
    const isActive = acf.active !== false

    return (
        <Link href={`/groups/${group.slug}`}
            className="group flex items-center gap-4 p-4 transition-transform hover:-translate-y-0.5 shadow-[5px_5px_0_#15102b] dark:shadow-[5px_5px_0_#000]"
            style={{ background: cor, color: tinta }}>
            <span className="relative h-[84px] w-[84px] shrink-0 overflow-hidden bg-[#15102b]">
                {img && <Image src={img.src} alt={`Foto do grupo ${name}`} fill sizes="84px" className={`object-cover object-top ${isActive ? '' : 'grayscale'}`} />}
            </span>
            <span className="min-w-0">
                <span className="block truncate text-[22px] font-black leading-tight">{name}</span>
                {acf.name_hangul && <span className="block truncate text-[13px] font-bold opacity-80">{acf.name_hangul}</span>}
                <span className="mt-1 block text-[12px] font-bold">{debutYear ? `Desde ${debutYear}` : ''}{!isActive ? ' · encerrado' : ''}</span>
                <span className="mt-2 inline-block bg-[#15102b] px-2.5 py-1 text-[11px] font-black text-white">Ver o grupo →</span>
            </span>
        </Link>
    )
}
