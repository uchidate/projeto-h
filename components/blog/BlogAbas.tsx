'use client'

import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

type Aba = { id: string; rotulo: string; node: ReactNode }

/**
 * Abas sem troca de rota: todos os painéis vêm no HTML (o robô e o leitor sem JS veem o
 * primeiro; os demais só ficam com `hidden`). O servidor monta os nós e só o estado da aba
 * ativa vive aqui, para não serializar os artigos inteiros para o navegador.
 */
export function BlogAbas({ abas, rotuloDoGrupo }: { abas: Aba[]; rotuloDoGrupo: string }) {
    const [ativa, setAtiva] = useState(abas[0]?.id)
    const botoes = useRef<Record<string, HTMLButtonElement | null>>({})
    /* Padrão ARIA de abas: só a ativa entra na ordem do Tab; as setas (e Home/End) trocam de aba. */
    function aoTeclar(e: KeyboardEvent<HTMLButtonElement>, i: number) {
        const passo = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
        const destino = e.key === 'Home' ? 0 : e.key === 'End' ? abas.length - 1 : passo ? (i + passo + abas.length) % abas.length : -1
        if (destino < 0) return
        e.preventDefault()
        setAtiva(abas[destino].id)
        botoes.current[abas[destino].id]?.focus()
    }
    return (
        <div>
            <div role="tablist" aria-label={rotuloDoGrupo} className="flex gap-5 border-b border-border">
                {abas.map((a, i) => {
                    const selecionada = a.id === ativa
                    return (
                        <button
                            key={a.id}
                            ref={el => { botoes.current[a.id] = el }}
                            tabIndex={selecionada ? 0 : -1}
                            onKeyDown={e => aoTeclar(e, i)}
                            type="button"
                            role="tab"
                            id={`aba-${a.id}`}
                            aria-selected={selecionada}
                            aria-controls={`painel-${a.id}`}
                            onClick={() => setAtiva(a.id)}
                            className={`touch-target -mb-px border-b-2 pb-2.5 pt-1 font-mono text-[11px] font-black uppercase tracking-[0.14em] transition-colors ${selecionada ? 'border-accent text-accent' : 'border-transparent text-foreground-subtle hover:text-foreground'}`}
                        >
                            {a.rotulo}
                        </button>
                    )
                })}
            </div>
            {abas.map(a => (
                <div key={a.id} role="tabpanel" id={`painel-${a.id}`} aria-labelledby={`aba-${a.id}`} hidden={a.id !== ativa}>
                    {a.node}
                </div>
            ))}
        </div>
    )
}
