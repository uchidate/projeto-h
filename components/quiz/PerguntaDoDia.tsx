'use client'

import Link from 'next/link'
import { useSyncExternalStore } from 'react'
import { podeGuardarHistorico } from '@/lib/consent'
import { interpretarEstado, sequenciaApos, sequenciaVigente, type EstadoDia } from '@/lib/quiz/dia'

const SERIF = 'font-[family-name:var(--font-playfair)]'
const CHAVE = 'hh:dia:v1'
const EVENTO = 'hh:dia'

export interface PerguntaDia { id: number; question: string; options: string[]; correct: number; explanation: string }

function lerCru(): string { try { return window.localStorage.getItem(CHAVE) ?? '' } catch { return '' } }
function assinar(aoMudar: () => void) {
    window.addEventListener('storage', aoMudar); window.addEventListener(EVENTO, aoMudar)
    return () => { window.removeEventListener('storage', aoMudar); window.removeEventListener(EVENTO, aoMudar) }
}

/** Uma pergunta por dia, igual para todos; a sequência de dias fica só no navegador (e só com consentimento). */
export function PerguntaDoDia({ pergunta, chave, dataExtenso, variante = 'padrao' }: { pergunta: PerguntaDia; chave: string; dataExtenso: string; /** 'alegre': cartão amarelo da sala de jogo do /quiz (já dentro do contêiner da página). */ variante?: 'padrao' | 'alegre' }) {
    const cru = useSyncExternalStore(assinar, lerCru, () => '')
    const estado = interpretarEstado(cru)
    const respondida = estado?.ultimo === chave
    const sequencia = sequenciaVigente(estado, chave)
    const marcada = respondida ? estado.resposta : null

    function responder(i: number) {
        if (respondida) return
        const novo: EstadoDia = { ultimo: chave, resposta: i, acertou: i === pergunta.correct, sequencia: sequenciaApos(estado, chave) }
        if (podeGuardarHistorico()) {
            try { window.localStorage.setItem(CHAVE, JSON.stringify(novo)); window.dispatchEvent(new Event(EVENTO)) } catch { /* sem armazenamento: a resposta não fica salva */ }
        }
    }

    if (variante === 'alegre') {
        const LETRAS = ['A', 'B', 'C', 'D']
        const CORES = ['#ff5fa2', '#38e1c0', '#7aa2ff', '#c39bff']
        return (
            <section aria-labelledby="dia-titulo" data-bloco="pergunta-do-dia" className="flex flex-col gap-5 bg-[#ffe14d] p-5 text-[#15102b] shadow-[10px_10px_0_#15102b] dark:shadow-[10px_10px_0_#000] sm:p-8">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="bg-[#15102b] px-3 py-1 text-[12px] font-black tracking-[0.12em] text-[#ffe14d]">PERGUNTA DO DIA</span>
                    <span id="dia-titulo" className="text-[14px] font-bold">{dataExtenso} · {sequencia > 0 ? `🔥 ${sequencia} ${sequencia === 1 ? 'dia seguido' : 'dias seguidos'}` : 'comece sua sequência'}</span>
                </div>
                <p className={`${SERIF} text-[26px] font-extrabold leading-[1.12] sm:text-[36px]`}>{pergunta.question}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                    {pergunta.options.map((op, i) => {
                        const certa = respondida && i === pergunta.correct
                        const errada = marcada === i && i !== pergunta.correct
                        return (
                            <button key={i} type="button" onClick={() => responder(i)} disabled={respondida}
                                className={`touch-target flex min-h-[56px] items-center gap-3 border-[3px] border-[#15102b] px-4 py-2 text-left text-[16px] font-extrabold transition-transform sm:text-[18px] ${certa ? 'bg-[#38e1c0]' : errada ? 'bg-[#ff5fa2]' : 'bg-white hover:-translate-y-0.5 disabled:opacity-70'}`}>
                                <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center text-[14px]" style={{ background: CORES[i] }}>{LETRAS[i]}</span>
                                <span className="flex-1">{op}</span>
                                {certa && <span className="text-[12px]">Certo!</span>}
                            </button>
                        )
                    })}
                </div>
                {respondida && (
                    <p aria-live="polite" className="text-[14px] font-medium leading-relaxed">{pergunta.explanation}</p>
                )}
            </section>
        )
    }

    return (
        <section aria-labelledby="dia-titulo" data-bloco="pergunta-do-dia" className="page-wrap py-6">
            <div className="border border-border bg-surface p-4 sm:p-6 lg:flex lg:gap-9">
                <div className="lg:w-[240px] lg:shrink-0">
                    <p className="font-mono text-[11px] font-black uppercase tracking-[0.16em] text-accent">Pergunta do dia</p>
                    <h2 id="dia-titulo" className={`${SERIF} mt-1 text-[26px] font-bold leading-none lg:text-[34px]`}>{dataExtenso}</h2>
                    <p className="mt-2 text-[14px] text-muted">
                        {sequencia > 0
                            ? respondida ? `🔥 ${sequencia} ${sequencia === 1 ? 'dia seguido' : 'dias seguidos'}. Volte amanhã para manter.` : `🔥 ${sequencia} ${sequencia === 1 ? 'dia seguido' : 'dias seguidos'}. Responda hoje para continuar.`
                            : 'Responda hoje e comece sua sequência.'}
                    </p>
                </div>
                <div className="mt-4 flex-1 lg:mt-0">
                    <p className={`${SERIF} text-[21px] font-semibold leading-tight lg:text-[24px]`}>{pergunta.question}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {pergunta.options.map((op, i) => {
                            const certa = respondida && i === pergunta.correct
                            const errada = marcada === i && i !== pergunta.correct
                            return (
                                <button key={i} type="button" onClick={() => responder(i)} disabled={respondida}
                                    className={`touch-target flex items-center justify-between gap-2 border px-4 py-3 text-left text-[15px] font-bold transition-colors ${
                                        certa ? 'border-green-500 bg-green-500/10' : errada ? 'border-red-500 bg-red-500/10' : 'border-border bg-background hover:border-accent/60 disabled:opacity-70'
                                    }`}>
                                    <span>{op}</span>
                                    {certa && <span className="text-[12px] text-green-500">Certo</span>}
                                </button>
                            )
                        })}
                    </div>
                    {respondida && (
                        <div aria-live="polite" className="mt-3">
                            <p className="text-[14px] leading-relaxed text-muted">{pergunta.explanation}</p>
                            <Link href="/quiz" className="touch-target mt-1 inline-flex items-center text-[14px] font-black text-accent hover:underline">Jogar o quiz completo →</Link>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}
