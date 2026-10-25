'use client'

import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'

export type ItemBusca = { rotulo: string; href: string; tipo: string; /** termos extras que também encontram o item (palavras-chave do guia) */ palavras?: string }

/** Termos que as pessoas usam como sinônimos; uma palavra da busca vale por todas do grupo. */
const SINONIMOS = [
    ['novela', 'dorama', 'drama', 'serie', 'series'],
    ['idol', 'idolo', 'idols', 'idolos'],
    ['cantor', 'cantora', 'cantores', 'cantoras', 'singer'],
    ['ator', 'atriz', 'atores', 'atrizes'],
    ['filme', 'filmes', 'cinema'],
    ['grupo', 'grupos', 'banda', 'bandas'],
    ['agencia', 'empresa', 'gravadora', 'label'],
    ['emissora', 'canal', 'tv'],
    ['streaming', 'plataforma', 'app'],
]
const variantes = (palavra: string) => SINONIMOS.find(g => g.includes(palavra)) ?? [palavra]

const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const MAX = 8

/** Busca ao vivo dos hubs: filtra os itens já carregados na página; sem JS cai na busca do site. */
export function HubBusca({ itens, placeholder = 'Buscar guia, prato ou marca', sugestoes = [] }: { itens: ItemBusca[]; placeholder?: string; sugestoes?: ItemBusca[] }) {
    const [q, setQ] = useState('')
    const [aberto, setAberto] = useState(false)
    const campo = useRef<HTMLInputElement>(null)
    const termo = semAcento(q.trim())
    const achados = useMemo(() => {
        if (termo.length < 2) return []
        const tokens = termo.split(/\s+/).filter(Boolean).map(variantes)
        const cobre = (texto: string) => tokens.every(vs => vs.some(v => texto.includes(v)))
        const noRotulo = itens.filter(i => cobre(semAcento(i.rotulo)))
        const noRestante = itens.filter(i => !noRotulo.includes(i) && cobre(semAcento(`${i.rotulo} ${i.palavras ?? ''}`)))
        return [...noRotulo, ...noRestante]
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
                placeholder={placeholder}
                aria-label={placeholder}
                className="min-w-0 flex-1 input-embutido border-0 bg-transparent p-0 text-[15px] text-foreground shadow-none placeholder:text-muted focus:outline-hidden"
            />
            {aberto && termo.length >= 2 && (
                <div className="absolute left-0 right-0 top-full z-30 mt-1 border border-border-strong bg-background shadow-lg">
                    {visiveis.length === 0 ? (
                        <div className="px-4 py-3 text-[14px] text-muted">
                            <p>Nenhum guia com “{q.trim()}”. <button type="submit" className="font-semibold text-accent underline">Buscar no site todo</button></p>
                            {sugestoes.length > 0 && (
                                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em]">Mais lidos</span>
                                    {sugestoes.map(g => <Link key={g.href} href={g.href} className="font-semibold text-foreground hover:text-accent">{g.rotulo}</Link>)}
                                </p>
                            )}
                        </div>
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
