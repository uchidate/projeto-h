import Image from 'next/image'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import type { WPPost } from '@/lib/wordpress/types'
import { getWPImage, readingTime, stripHtml } from '@/lib/utils'
import { motivoDaSugestao } from '@/lib/blog/motivoSugestao'

/**
 * Sugestão no meio do texto.
 *
 * Medido em 2026-10 (Umami, 28 dias, só humanos): de 740 sessões de artigo, 49%
 * passam de 25% da página, 32% de 50%, 20% de 75% e 3% chegam ao fim. O
 * fechamento ("Para ler a seguir") foi visto em 21 sessões. Aqui a sugestão
 * fica onde a maioria ainda está lendo.
 *
 * Compacta de propósito: uma linha de convite, sem imagem grande, para não
 * quebrar a leitura nem competir com o anúncio da primeira quebra.
 */
export function BlogSugestaoMeio({ atual, candidato }: { atual: WPPost; candidato: WPPost | undefined }) {
    if (!candidato) return null
    const titulo = stripHtml(candidato.title.rendered)
    const imagem = getWPImage(candidato._embedded, candidato.featured_image_url)
    const minutos = candidato.acf?.reading_time ?? readingTime(candidato.content?.rendered ?? '')
    const motivo = motivoDaSugestao(atual, candidato, { categoria: true })

    return (
        <aside data-bloco="artigo-meio" aria-label="Leitura relacionada" className="not-prose my-8">
            <Link
                href={`/blog/${candidato.slug}`}
                className="group flex items-center gap-4 border border-border bg-surface p-3 transition-colors hover:border-accent/60 sm:p-4"
            >
                {imagem && (
                    <span className="relative block h-16 w-16 shrink-0 overflow-hidden bg-background sm:h-20 sm:w-28">
                        <Image src={imagem.src} alt="" fill sizes="112px" className="object-cover" />
                    </span>
                )}
                <span className="min-w-0 flex-1">
                    <span className="mb-1 block font-mono text-[9px] font-black uppercase tracking-[0.16em] text-accent">
                        {motivo?.texto ?? 'Leia também'}
                    </span>
                    <span className="line-clamp-2 block text-[16px] font-black leading-snug tracking-[-0.02em] text-foreground transition-colors group-hover:text-accent">
                        {titulo}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-[12px] text-muted">
                        <Clock size={11} className="shrink-0" />
                        {minutos} min de leitura
                    </span>
                </span>
            </Link>
        </aside>
    )
}
