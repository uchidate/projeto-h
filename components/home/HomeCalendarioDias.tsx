'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from '@/components/i18n/LocalizedLink'

const MARROM = 'text-[#8a5a00]'
const ROTULO = 'font-mono text-[11px] font-bold uppercase tracking-[0.12em]'

export interface ItemDia {
    nome: string
    hangul: string | null
    foto: string | null
    idade: number
    href: string
}

export interface DiaCalendario {
    data: string
    semana: string
    dia: string
    diaMes: string
    itens: ItemDia[]
}

export interface RotulosCalendario {
    hoje: string
    aSeguir: string
    tag: string
    anos: string
    semAniversario: string
    escolherDia: string
    /** Só no português: link para a página do calendário. */
    abrirHref: string | null
    abrir: string
}

/**
 * Faixa de sete dias que responde ao clique: o dia escolhido mostra os aniversariantes dele; "a seguir"
 * resume os outros dias e também seleciona. Antes a faixa era só enfeite e parecia clicável.
 * O primeiro desenho (hoje) vem renderizado no servidor, igual ao de antes.
 */
export function HomeCalendarioDias({ dias, rotulos }: { dias: DiaCalendario[]; rotulos: RotulosCalendario }) {
    const [sel, setSel] = useState(0)
    const atual = dias[sel]
    const seguintes = dias.map((d, i) => ({ d, i })).filter(({ d, i }) => i > 0 && i !== sel && d.itens.length > 0)

    return (
        <>
            <div role="group" aria-label={rotulos.escolherDia} className="mt-2.5 grid grid-cols-7 gap-1">
                {dias.map((d, i) => {
                    const ativo = i === sel
                    return (
                        <button
                            key={d.data}
                            type="button"
                            aria-pressed={ativo}
                            onClick={() => setSel(i)}
                            className={`flex cursor-pointer flex-col items-center border py-1 leading-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#8a5a00] ${ativo ? 'border-[#8a5a00] bg-[#8a5a00] text-white' : 'border-border text-foreground hover:border-[#8a5a00]'}`}
                        >
                            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] opacity-80">{d.semana}</span>
                            <span className="mt-1 text-[14px] font-black">{d.dia}</span>
                            <span aria-hidden className={`mt-1 h-1 w-1 rounded-full ${d.itens.length > 0 ? (ativo ? 'bg-white' : 'bg-[#8a5a00]') : 'bg-transparent'}`} />
                        </button>
                    )
                })}
            </div>

            <section className="mt-3" aria-live="polite">
                <div className="flex items-baseline justify-between border-b border-border pb-1.5">
                    <h3 className={`${ROTULO} text-foreground`}>{sel === 0 ? `${rotulos.hoje} · ` : ''}{atual.semana} {atual.diaMes}</h3>
                    <span className={`${ROTULO} ${MARROM}`}>{rotulos.tag}</span>
                </div>
                {atual.itens.length > 0 ? (
                    <ul>
                        {atual.itens.map(a => (
                            <li key={a.href} className="border-b border-border last:border-b-0">
                                <Link href={a.href} className="group flex items-center gap-3 py-2.5">
                                    <span className="relative h-[50px] w-10 shrink-0 overflow-hidden bg-surface">
                                        {a.foto && <Image src={a.foto} alt="" fill sizes="40px" className="object-cover" />}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-[14px] font-black leading-tight text-foreground group-hover:text-accent">{a.nome}</span>
                                        {a.hangul && <span className="block truncate text-[11px] text-muted">{a.hangul}</span>}
                                    </span>
                                    <span className="shrink-0 text-right leading-none">
                                        <span className={`block text-[22px] font-black ${MARROM}`}>{a.idade}</span>
                                        <span className="mt-1 block font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-muted">{rotulos.anos}</span>
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="py-3 text-[13px] text-muted">
                        {rotulos.semAniversario}
                        {rotulos.abrirHref && <> <Link href={rotulos.abrirHref} className="font-semibold text-foreground hover:text-accent hover:underline">{rotulos.abrir}</Link></>}
                    </p>
                )}
            </section>

            {seguintes.length > 0 && (
                <section className="mt-3">
                    <div className="flex items-baseline justify-between border-b border-border pb-1.5">
                        <h3 className={`${ROTULO} text-foreground`}>{rotulos.aSeguir}</h3>
                        <span className={`${ROTULO} ${MARROM}`}>{rotulos.tag}</span>
                    </div>
                    <ul>
                        {seguintes.map(({ d, i }) => (
                            <li key={d.data} className="flex gap-3 border-b border-border py-2.5 last:border-b-0">
                                <button type="button" onClick={() => setSel(i)} className={`w-[46px] shrink-0 cursor-pointer whitespace-nowrap pt-0.5 text-left hover:underline ${ROTULO} ${MARROM}`}>{d.semana} {d.dia}</button>
                                <span className="text-[13px] font-semibold leading-snug text-foreground">
                                    {d.itens.slice(0, 3).map((a, k) => (
                                        <span key={a.href}>
                                            {k > 0 && ', '}
                                            <Link href={a.href} className="hover:text-accent hover:underline">{a.nome}</Link>
                                        </span>
                                    ))}
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </>
    )
}
