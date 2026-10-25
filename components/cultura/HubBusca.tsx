'use client'

import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'

export type ItemBusca = { rotulo: string; href: string; tipo: 'Guia' | 'Prato' | 'Marca' }

const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const MAX = 8

/** Busca ao vivo do hub: filtra guias, pratos e marcas já carregados na página; sem JS cai na busca do site. */
export function HubBusca({ itens }: { itens: ItemBusca[] }) {
    const [q, setQ] = useState('')
    const [aberto, setAberto] = useState(false)
    const campo = useRef<HTMLInputElement>(null)
    const termo = semAcento(q.trim())
    const achados = useMemo(() => {
        if (termo.length < 2) return []
        return itens.filter(i => semAcento(i.rotulo).includes(termo))
    }, [itens, termo])
    const visiveis = achados.slice(0, MAX)

    return (
        <form
            action="/search"
            role="search"
            className="relative flex h-12 w-full min-w-0 items-center gap-3 border border-border-strong bg-surface px-4 transition-colors focus-within:border-foreground lg:max-w-[560px] lg:flex-1"
            onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setAberto(false) }}
        >
            <Search aria-hidden className="h-[18px] w-[18px] shrink-0 text-muted" />
            <input
                ref={campo}
                name="q"
                type="text" enterKeyHint="search"
                value={q}
                autoComplete="off"
                onChange={e => { setQ(e.target.value); setAberto(true) }}
                onFocus={() => setAberto(true)}
                onKeyDown={e => { if (e.key === 'Escape') { setAberto(false); campo.current?.blur() } }}
                placeholder="Buscar guia, prato ou marca"
                aria-label="Buscar guia, prato ou marca"
                className="min-w-0 flex-1 input-embutido border-0 bg-transparent p-0 text-[15px] text-foreground shadow-none placeholder:text-muted focus:outline-hidden"
            />
            {aberto && termo.length >= 2 && (
                <div className="absolute left-0 right-0 top-full z-30 mt-1 border border-border-strong bg-background shadow-lg">
                    {visiveis.length === 0 ? (
                        <p className="px-4 py-3 text-[14px] text-muted">Nada encontrado nesta página. <button type="submit" className="font-semibold text-accent underline">Buscar no site todo</button></p>
                    ) : (
                        <ul>
                            {visiveis.map(i => (
                                <li key={i.href} className="border-t border-border first:border-t-0">
                                    <Link href={i.href} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-surface">
                                        <span className="text-[14px] font-semibold text-foreground">{i.rotulo}</span>
                                        <span className="shrink-0 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted">{i.tipo}</span>
                                    </Link>
                                </li>
                            ))}
                            {achados.length > MAX && (
                                <li className="border-t border-border">
                                    <button type="submit" className="w-full px-4 py-2.5 text-left font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent">{`Ver todos os ${achados.length} resultados no site →`}</button>
                                </li>
                            )}
                        </ul>
                    )}
                </div>
            )}
        </form>
    )
}
