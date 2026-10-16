'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Episodio } from '@/lib/tmdb/episodios'

interface Textos {
    episodio: string
    votos: string
    posicao: string
    semSinopse: string
    fonte: string
    pico: string
    menor: string
    estreia: string
    final: string
    minutos: string
}

interface Props {
    episodios: Episodio[]
    ariaLabel: string
    textos: Textos
    accent: string
}

/** `{n}`, `{total}`, `{nota}` e `{min}` nos textos são trocados aqui: server component só passa strings. */
const fmt = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''))

/**
 * Notas por episódio (TMDB) como barras clicáveis, com o cartão do episódio escolhido.
 * Começa no episódio de maior nota. A altura é relativa ao intervalo real, mas o número
 * e a contagem de votos ficam à vista para o leitor medir o peso da nota.
 */
export function EpisodiosPainel({ episodios, ariaLabel, textos, accent }: Props) {
    const notas = episodios.map(e => e.nota)
    const lo = Math.min(...notas)
    const hi = Math.max(...notas)
    const ranking = [...episodios].sort((a, b) => b.nota - a.nota || a.n - b.n).map(e => e.n)
    const pico = episodios.find(e => e.n === ranking[0]) ?? episodios[0]
    const menor = episodios.find(e => e.n === ranking[ranking.length - 1]) ?? episodios[0]
    const [selecionado, setSelecionado] = useState(pico.n)
    const atual = episodios.find(e => e.n === selecionado) ?? pico
    const altura = (nota: number) => 30 + ((nota - lo) / (hi - lo || 1)) * 70

    return (
        <div>
            <div className="rounded-xl border border-border p-4 sm:p-5">
                <div role="group" aria-label={ariaLabel} className="flex h-[180px] items-end gap-[3px] sm:gap-1.5">
                    {episodios.map(e => (
                        <button
                            key={e.n} type="button" onClick={() => setSelecionado(e.n)} aria-pressed={e.n === selecionado}
                            aria-label={fmt(textos.episodio, { n: e.n }) + `: ${e.nota}`}
                            className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                        >
                            <span className={`hidden text-[11px] sm:block ${e.n === selecionado ? 'font-bold text-foreground' : 'text-muted'}`}>{e.nota}</span>
                            <span
                                aria-hidden className="block w-full rounded-t-md transition-[filter] hover:brightness-125 motion-reduce:transition-none"
                                style={{ height: `${altura(e.nota)}%`, background: e.n === selecionado ? accent : 'color-mix(in srgb, var(--foreground, #fff) 28%, transparent)' }}
                            />
                            <span className="text-[11px] text-muted">{e.n}</span>
                        </button>
                    ))}
                </div>
                <div className="mt-3 flex flex-wrap justify-between gap-x-4 text-[12px] text-muted">
                    <span>{textos.estreia}</span>
                    <span>{fmt(textos.pico, { n: pico.n, nota: pico.nota })} · {fmt(textos.menor, { n: menor.n, nota: menor.nota })}</span>
                    <span>{textos.final}</span>
                </div>
            </div>

            <article className="mt-4 grid overflow-hidden rounded-xl border border-border sm:grid-cols-[1fr_1.1fr]" aria-live="polite">
                <div className="relative aspect-video bg-surface sm:aspect-auto sm:min-h-[200px]">
                    {atual.imagem && <Image src={atual.imagem} alt="" fill sizes="(min-width: 640px) 40vw, 100vw" className="object-cover" />}
                </div>
                <div className="p-4 sm:p-5">
                    <p className="text-[13px] text-muted">
                        {fmt(textos.episodio, { n: atual.n })}
                        {atual.minutos ? ` · ${fmt(textos.minutos, { min: atual.minutos })}` : ''}
                        {atual.data ? ` · ${atual.data}` : ''}
                    </p>
                    {atual.titulo && <h3 className="mt-1 text-[19px] font-bold leading-snug">{atual.titulo}</h3>}
                    <p className="mt-2 flex flex-wrap items-center gap-2 text-[13px]">
                        <span className="font-black" style={{ color: accent }}>★ {atual.nota}</span>
                        <span className="rounded-full border border-border px-2.5 py-0.5 text-muted">{fmt(textos.votos, { n: atual.votos })}</span>
                        <span className="rounded-full border border-border px-2.5 py-0.5 text-muted">
                            {fmt(textos.posicao, { n: ranking.indexOf(atual.n) + 1, total: episodios.length })}
                        </span>
                    </p>
                    <p className="mt-3 text-[15px] leading-7 text-foreground-subtle">{atual.sinopse || textos.semSinopse}</p>
                    <p className="mt-3 text-[12px] text-muted">{textos.fonte}</p>
                </div>
            </article>
        </div>
    )
}
