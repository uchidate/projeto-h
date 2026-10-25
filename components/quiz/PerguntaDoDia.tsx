'use client'

import Link from 'next/link'
import { useState, useSyncExternalStore } from 'react'
import { podeGuardarHistorico } from '@/lib/consent'
import { AvisoConsentimento } from '@/components/consent/AvisoConsentimento'
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
    const guardado = interpretarEstado(cru)
    // Sem permissão para guardar, a resposta vale só nesta visita (fica em memória): a pergunta funciona igual.
    const [naSessao, setNaSessao] = useState<EstadoDia | null>(null)
    const estado = guardado?.ultimo === chave ? guardado : naSessao?.ultimo === chave ? naSessao : guardado
    const respondida = estado?.ultimo === chave
    const sequencia = sequenciaVigente(estado, chave)
    const marcada = respondida ? estado.resposta : null

    function responder(i: number) {
        if (respondida) return
        const novo: EstadoDia = { ultimo: chave, resposta: i, acertou: i === pergunta.correct, sequencia: sequenciaApos(estado, chave) }
        if (podeGuardarHistorico()) {
            try { window.localStorage.setItem(CHAVE, JSON.stringify(novo)); window.dispatchEvent(new Event(EVENTO)); return } catch { /* sem armazenamento: cai para a memória */ }
        }
        setNaSessao(novo)
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
                                className={`touch-target flex min-h-[56px] items-center gap-3 border-[3px] border-[#15102b] px-4 py-2 text-left text-[16px] font-extrabold transition-transform sm:text-[18px] ${certa ? 'bg-[#38e1c0]' : errada ? 'bg-[#ff5fa2]' : 'bg-white hover:-translate-y-0.5 hover:bg-accent/5 disabled:opacity-70'}`}>
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
                {respondida && <AvisoConsentimento recurso="sua sequência de dias" />}
            </section>
        )
    }

    return (
        <section aria-labelledby="dia-titulo" data-bloco="pergunta-do-dia" className="flex min-w-0 flex-col justify-center border border-l-[3px] border-border border-l-[#8a5a00] bg-[var(--color-home-card)] p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
                <div className="min-w-0 lg:flex-1">
                    <p className={`${SERIF} text-[21px] font-semibold leading-tight lg:text-[22px]`}>{pergunta.question}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2.5">
                        <span className="border border-[#8a5a00] px-1.5 py-1 font-mono text-[11px] font-black uppercase leading-none tracking-[0.12em] text-[#8a5a00]">Pergunta do dia</span>
                        <h2 id="dia-titulo" className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[#8a5a00]">{dataExtenso}</h2>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 lg:w-[400px] lg:shrink-0">
                    {pergunta.options.map((op, i) => {
                        const certa = respondida && i === pergunta.correct
                        const errada = marcada === i && i !== pergunta.correct
                        return (
                            <button key={i} type="button" onClick={() => responder(i)} disabled={respondida}
                                className={`touch-target flex items-center justify-center gap-2 border-2 px-3 py-3.5 text-center text-[15px] font-bold leading-snug transition-colors ${
                                    certa ? 'border-green-500 bg-green-500/10' : errada ? 'border-red-500 bg-red-500/10' : 'border-border bg-background hover:border-accent/60 hover:bg-accent/5 disabled:opacity-70'
                                }`}>
                                <span>{op}</span>
                                {certa && <span className="text-[11px] text-green-500">Certo</span>}
                            </button>
                        )
                    })}
                </div>
            </div>
            {respondida && (
                <div aria-live="polite" className="mt-3">
                    <p className="text-[14px] leading-relaxed text-muted">{pergunta.explanation}</p>
                    <p className="mt-1 text-[13px] text-muted">
                        {sequencia > 0 ? `🔥 ${sequencia} ${sequencia === 1 ? 'dia seguido' : 'dias seguidos'}. Volte amanhã para manter.` : 'Volte amanhã para começar sua sequência.'}
                    </p>
                    <Link href="/quiz" className="touch-target mt-1 inline-flex items-center text-[14px] font-black text-accent hover:underline">Jogar o quiz completo →</Link>
                    <AvisoConsentimento recurso="sua sequência de dias" className="mt-2 text-muted" />
                </div>
            )}
        </section>
    )
}
