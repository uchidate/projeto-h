'use client'

import { useState, useMemo } from 'react'
import { CheckCircle2, XCircle, ArrowRight, Play } from 'lucide-react'
import type { QuizQuestion } from '@/lib/wordpress/quiz'
import { QUIZ_SIZE } from '../lib/config'

// ─── Teaser ───────────────────────────────────────────────────────────────────

/**
 * Pergunta jogável na própria capa. A técnica é pré-compromisso: a página não
 * pede que a pessoa decida jogar, ela já a coloca jogando. Quem responde uma
 * pergunta e recebe a explicação na hora chega ao botão "continuar" já dentro
 * da atividade, não avaliando se entra nela.
 *
 * Três decisões deliberadas:
 * - A pergunta sai do nível iniciante quando existe. Um acerto logo de cara é o
 *   que sustenta a sequência; abrir com a mais difícil filtra gente fora.
 * - O feedback traz a explicação completa, não só certo/errado. É a amostra do
 *   que o quiz entrega, e o que justifica continuar.
 * - Vale zero ponto, e a tela diz isso. Contar pontos de uma pergunta respondida
 *   fora do cronômetro inflaria o placar de quem só passou pela capa.
 *
 * A escolha é determinística (menor id do lote) porque este componente é
 * renderizado no servidor: sortear no render daria hidratação divergente. O
 * botão "outra pergunta" faz o sorteio depois, já no cliente.
 */
export function TeaserQuestion({ pool, onContinue }: {
    pool: QuizQuestion[]
    onContinue: (excludeId: number) => void
}) {
    const [step, setStep] = useState(0)
    const [picked, setPicked] = useState<number | null>(null)

    const candidates = useMemo(() => {
        const easy = pool.filter(q => q.difficulty === 'easy')
        const base = easy.length > 0 ? easy : pool
        return [...base].sort((a, b) => a.id - b.id)
    }, [pool])

    const q = candidates.length > 0 ? candidates[step % candidates.length] : null
    if (!q) return null

    const answered = picked !== null
    const correct = picked === q.correct

    return (
        <section className="border-t border-border pt-6">
            <div className="mb-4 flex items-baseline gap-3">
                <h2 className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-accent">
                    Comece por aqui
                </h2>
                <p className="font-mono text-[10px] text-muted">Sem cronômetro, sem pontos</p>
                {!answered && candidates.length > 1 && (
                    <button type="button" onClick={() => setStep(s => s + 1)}
                        className="ml-auto font-mono text-[10px] uppercase tracking-widest text-muted transition-colors hover:text-foreground">
                        Outra pergunta ↻
                    </button>
                )}
            </div>

            <p className="max-w-[34ch] font-serif text-[clamp(1.375rem,2.6vw,2rem)] font-medium leading-[1.15] text-foreground sm:max-w-[46ch]">
                {q.question}
            </p>

            <div className="mt-6 grid gap-x-6 sm:grid-cols-2">
                {q.options.map((opt, i) => {
                    const isCorrect = i === q.correct
                    const isPicked = i === picked
                    const state = !answered ? 'idle' : isCorrect ? 'correct' : isPicked ? 'wrong' : 'muted'
                    return (
                        <button key={i} type="button" disabled={answered}
                            onClick={() => setPicked(i)}
                            className={`flex items-start gap-3 border-t py-3 text-left transition-colors ${
                                state === 'correct' ? 'border-green-400 text-green-400'
                                : state === 'wrong' ? 'border-red-400 text-red-400'
                                : state === 'muted' ? 'border-border text-muted'
                                : 'border-border text-foreground hover:border-accent hover:text-accent'
                            }`}>
                            <span className="mt-0.5 font-mono text-[11px] font-black opacity-60">
                                {String.fromCharCode(65 + i)}
                            </span>
                            <span className="flex-1 text-[15px] font-bold leading-snug">{opt}</span>
                            {state === 'correct' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
                            {state === 'wrong' && <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                        </button>
                    )
                })}
            </div>

            {answered && (
                <div className="mt-6 border-t border-border pt-5">
                    <p className={`font-mono text-[11px] font-black uppercase tracking-[0.14em] ${correct ? 'text-green-400' : 'text-red-400'}`}>
                        {correct ? 'Acertou' : 'Não foi dessa vez'}
                    </p>
                    {q.explanation && (
                        <p className="mt-2 max-w-[62ch] text-[14px] leading-relaxed text-muted">{q.explanation}</p>
                    )}
                    <button type="button" onClick={() => onContinue(q.id)}
                        className="mt-5 inline-flex items-center gap-3 bg-accent-a11y px-6 py-3.5 text-[15px] font-black text-white transition-opacity hover:opacity-90 active:scale-[0.99]">
                        <Play className="h-4 w-4 fill-current" />
                        {correct ? 'Continuar valendo pontos' : 'Tentar valendo pontos'}
                        <ArrowRight className="h-4 w-4" />
                    </button>
                    <p className="mt-2 font-mono text-[10px] text-muted">
                        {QUIZ_SIZE} perguntas · esta não se repete
                    </p>
                </div>
            )}
        </section>
    )
}
