import Image from 'next/image'
import Link from 'next/link'
import { Star } from 'lucide-react'
import type { WPProduction } from '@/lib/wordpress/types'
import { getWPImage, stripHtml } from '@/lib/utils'
import { SectionTitleBar } from '@/components/ui/SectionTitleBar'

interface Props {
    items: WPProduction[]
    eyebrow: string
    title: string
}

/**
 * "Comece por aqui": as melhores avaliadas do guia, antes da grade de 48 itens.
 * Medido em 2026-10 (Umami): guias têm ~12 mil px de rolagem no celular e 4% chegam ao
 * fim; quem não sabe por onde começar sai na primeira página (78% de saída em guias).
 * Os três primeiros viram cartas largas, com a nota e o porquê; o resto, uma fileira curta.
 */
export function HubDestaques({ items, eyebrow, title }: Props) {
    if (items.length < 3) return null
    const [primeiros, resto] = [items.slice(0, 3), items.slice(3, 6)]
    return (
        <section aria-labelledby="hub-destaques" data-bloco="guia-destaques" className="mb-12">
            <SectionTitleBar eyebrow={eyebrow} title={title} />
            <ol className="grid gap-4 md:grid-cols-3">
                {primeiros.map((p, i) => <Destaque key={p.id} producao={p} posicao={i + 1} />)}
            </ol>
            {resto.length > 0 && (
                <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                    {resto.map(p => {
                        const nome = stripHtml(p.title.rendered)
                        return (
                            <li key={p.id}>
                                <Link href={`/productions/${p.slug}`}
                                    className="flex items-center justify-between gap-3 border border-border bg-surface px-4 py-3 text-[13px] font-semibold text-foreground transition-colors hover:border-accent hover:text-accent">
                                    <span className="line-clamp-1">{nome}</span>
                                    {p.acf?.rating != null && (
                                        <span className="flex shrink-0 items-center gap-1 text-gold"><Star size={11} fill="currentColor" />{Number(p.acf.rating).toFixed(1)}</span>
                                    )}
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            )}
        </section>
    )
}

function Destaque({ producao, posicao }: { producao: WPProduction; posicao: number }) {
    const acf = producao.acf ?? {}
    const img = getWPImage(producao._embedded, producao.featured_image_url)
    const nome = stripHtml(producao.title.rendered)
    const detalhes = [acf.year, acf.genre, acf.episodes ? `${acf.episodes} ep.` : null].filter(Boolean).join(' · ')
    return (
        <li>
            <Link href={`/productions/${producao.slug}`} className="group grid grid-cols-[96px_minmax(0,1fr)] gap-4 border border-border bg-surface p-3 transition-colors hover:border-accent md:grid-cols-1 md:p-0">
                <div className="relative aspect-2/3 w-full overflow-hidden bg-background md:aspect-video">
                    {img && (
                        <Image src={img.src} alt="" fill priority={posicao === 1} sizes="(max-width: 768px) 96px, 33vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                    )}
                    <span className="absolute left-0 top-0 bg-accent px-2 py-1 font-mono text-[11px] font-black text-white">{posicao}</span>
                </div>
                <div className="flex min-w-0 flex-col justify-center md:p-4">
                    <h3 className="font-serif text-[20px] font-semibold leading-tight text-foreground group-hover:text-accent">{nome}</h3>
                    {detalhes && <p className="mt-1 text-[12px] text-muted">{detalhes}</p>}
                    {acf.rating != null && (
                        <p className="mt-2 flex items-center gap-1 text-[13px] font-bold text-gold">
                            <Star size={12} fill="currentColor" />{Number(acf.rating).toFixed(1)}<span className="font-normal text-muted">/10</span>
                        </p>
                    )}
                </div>
            </Link>
        </li>
    )
}
