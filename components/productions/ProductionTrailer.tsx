'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Play } from 'lucide-react'

interface Props {
    videoId: string
    title: string
    /** Texto do botão de reprodução, para leitor de tela. */
    playLabel: string
}

/**
 * Trailer em largura total (16:9), com a miniatura do YouTube e o vídeo só depois do
 * clique. O player anterior (`GroupMVPlayer`, feito para lista de MVs) mostrava o
 * trailer único em meia largura e acrescentava o próprio cabeçalho ("MVs Principais")
 * embaixo do título da seção. Carregar o iframe só no clique também poupa o LCP e a
 * banda de quem só quer ler.
 */
export function ProductionTrailer({ videoId, title, playLabel }: Props) {
    const [tocando, setTocando] = useState(false)

    return (
        <div className="relative aspect-video w-full overflow-hidden border border-border bg-black">
            {tocando ? (
                <iframe
                    src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
                    title={title}
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full"
                />
            ) : (
                <button type="button" onClick={() => setTocando(true)} aria-label={playLabel} className="group absolute inset-0 block h-full w-full cursor-pointer">
                    <Image src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt="" fill sizes="(min-width: 1280px) 880px, 100vw" className="object-cover opacity-85 transition-opacity group-hover:opacity-100" />
                    <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-[#0d0b0f] transition-transform group-hover:scale-105 lg:h-[76px] lg:w-[76px]">
                        <Play size={26} fill="currentColor" />
                    </span>
                </button>
            )}
        </div>
    )
}
