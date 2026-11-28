'use client'

import { useState, type ReactNode } from 'react'
import Image from 'next/image'
import Link from '@/components/i18n/LocalizedLink'
import type { ShowsByPlatform } from '@/lib/tmdb/streaming'
import { STREAMING_PLATFORMS, PLATFORM_ORDER } from '@/lib/tmdb/streaming'

interface Props {
    porPlataforma: ShowsByPlatform
    /** Crédito ao JustWatch, montado no servidor (as mensagens dele não vão para o cliente). */
    credito?: ReactNode
}

// Chaves de lib/tmdb/streaming.ts → slugs aceitos pelo filtro de plataforma da listagem.
const SLUG_NA_LISTAGEM: Record<string, string> = {
    netflix_br: 'netflix',
    disney_br: 'disney-plus',
    prime_br: 'amazon-prime-video',
    apple_br: 'apple-tv',
}

/**
 * Séries coreanas populares em cada streaming no Brasil, na ficha de produção. Só em português.
 *
 * É a ordem de popularidade do TMDB entre o que cada plataforma tem aqui, não o Top 10
 * oficial dela: o texto não pode prometer ranking oficial nem numerar as posições.
 * Os cliques são medidos pelo `data-bloco` (RastreioDeRecirculacao).
 */
export function EmAltaNoStreaming({ porPlataforma, credito }: Props) {
    const disponiveis = PLATFORM_ORDER.filter(p => (porPlataforma[p]?.length ?? 0) > 0)
    const [escolhida, setEscolhida] = useState<string>('')

    if (disponiveis.length === 0) return null

    // Ao navegar entre fichas a plataforma escolhida pode não existir na próxima.
    const ativa = disponiveis.find(p => p === escolhida) ?? disponiveis[0]
    const nome = STREAMING_PLATFORMS[ativa].label

    return (
        <section id="em-alta" aria-labelledby="h-em-alta" data-bloco="producao-streaming" className="scroll-mt-(--scroll-anchor-offset,134px)">
            <h2 id="h-em-alta" className="font-serif text-[26px] font-semibold text-foreground">Em alta no streaming</h2>
            <p className="mt-1 text-[13px] text-muted">Séries coreanas populares em cada plataforma no Brasil, segundo o TMDB.</p>

            <div className="mt-4 flex flex-wrap gap-2">
                {disponiveis.map(p => (
                    <button
                        key={p}
                        type="button"
                        onClick={() => setEscolhida(p)}
                        aria-pressed={p === ativa}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${p === ativa ? 'border-foreground text-foreground' : 'border-border text-muted hover:text-foreground'}`}
                    >
                        <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: STREAMING_PLATFORMS[p].hex }} />
                        {STREAMING_PLATFORMS[p].label}
                    </button>
                ))}
            </div>

            <ul className="mt-4 flex snap-x gap-3 overflow-x-auto pb-2">
                {porPlataforma[ativa].map(show => (
                    <li key={show.tmdbId} className="w-[112px] shrink-0 snap-start sm:w-[132px]">
                        <Link href={`/productions/${show.productionSlug}`} className="group block">
                            <div className="relative aspect-2/3 w-full overflow-hidden bg-surface">
                                {show.posterUrl && (
                                    <Image src={show.posterUrl} alt="" fill className="object-cover" sizes="(max-width: 640px) 112px, 132px" />
                                )}
                            </div>
                            <p className="mt-1.5 line-clamp-2 text-[12px] font-semibold leading-tight text-foreground group-hover:text-accent">
                                {show.title}
                            </p>
                        </Link>
                    </li>
                ))}
            </ul>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <Link href={`/productions?platform=${SLUG_NA_LISTAGEM[ativa]}`} className="text-[13px] font-semibold text-accent hover:underline">
                    Ver produções na {nome}
                </Link>
                {credito}
            </div>
        </section>
    )
}
