'use client'

import { Children, useState, type ReactNode } from 'react'

export type AbaCelular = { chave: string; rotulo: string; cor?: string }

/**
 * No celular, blocos irmãos (editorias, rankings, temas) viram abas: só um painel aparece por vez
 * e a página fica curta. A partir de `lg` os botões somem e todos os painéis aparecem, como antes
 * (o painel usa `contents`, então o layout de quem chama continua valendo).
 * Os painéis chegam prontos do servidor como filhos, na mesma ordem de `abas`.
 */
export function AbasCelular({ abas, rotulo, className = '', children }: { abas: AbaCelular[]; rotulo: string; className?: string; children: ReactNode }) {
    const [ativa, setAtiva] = useState(0)
    const paineis = Children.toArray(children)
    if (paineis.length < 2) return <div className={className}>{paineis}</div>
    return (
        <div className={className}>
            <div role="group" aria-label={rotulo} className="flex gap-2 lg:hidden">
                {abas.map((aba, i) => {
                    const cor = aba.cor ?? 'var(--color-accent)'
                    return (
                        <button key={aba.chave} type="button" aria-pressed={i === ativa} onClick={() => setAtiva(i)}
                            className="min-h-11 min-w-0 flex-1 border px-2 py-1.5 text-center font-mono text-[10px] font-black uppercase leading-tight tracking-[0.08em] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                            style={i === ativa ? { backgroundColor: cor, borderColor: cor, color: '#fff' } : { borderColor: cor, color: 'var(--color-foreground)', backgroundColor: 'var(--color-home-card)' }}>
                            {aba.rotulo}
                        </button>
                    )
                })}
            </div>
            {paineis.map((painel, i) => (
                <div key={abas[i]?.chave ?? i} className={i === ativa ? 'contents' : 'hidden lg:contents'}>{painel}</div>
            ))}
        </div>
    )
}
