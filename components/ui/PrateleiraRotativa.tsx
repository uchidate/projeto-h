'use client'
/* eslint-disable react-hooks/set-state-in-effect -- sorteio depende de Math.random(), que não pode rodar durante a renderização (SSR determinístico) */

import { useEffect, useState } from 'react'
import type { StoreProduct } from '@/lib/wordpress/store'
import { sortearPrateleira } from '@/lib/wordpress/store-rotacao'
import { StoreCard } from '@/components/ui/StoreCard'
import { useVitrineVista } from '@/components/ui/VitrineVista'

interface Props {
    /** Já vem ordenado (aderência > destaque > desconto > CTR/comissão > posição) — o sorteio só escolhe quais aparecem. */
    produtos: StoreProduct[]
    contexto: string
    quantidade?: number
}

/**
 * Sorteia quais produtos aparecem a cada NOVA visualização da página, pra não
 * travar sempre os 4 mesmos anúncios pro mesmo visitante que volta várias
 * vezes. Roda no navegador (a página é cacheada por até 5 min via ISR — um
 * sorteio no servidor mostraria o mesmo resultado pra todo mundo até a
 * próxima geração).
 *
 * Ninguém é fixo: o sorteio é PONDERADO pela posição na ordem recebida (que já embute
 * aderência ao conteúdo, CTR e comissão), com bônus leve para destaque/desconto e
 * desconto de peso para o que este visitante viu nas últimas visitas (localStorage).
 * O mais aderente aparece mais, mas não sempre — e não repete a cada visita.
 *
 * Primeiro render usa a ordem recebida do servidor (idêntica ao HTML enviado,
 * sem mismatch de hidratação); o sorteio troca depois, no efeito — roda uma
 * vez por montagem, ou seja, a cada carregamento/navegação da página.
 */
/** Troca o último slot por um candidato da `loja` quando nenhum dos exibidos já é dela — determinístico, seguro pro primeiro render (SSR) e pro sorteio depois. */
function garantirLoja(selecionados: StoreProduct[], produtos: StoreProduct[], loja: string): StoreProduct[] {
    if (selecionados.some(p => p.acf.store === loja)) return selecionados
    const candidato = produtos.find(p => p.acf.store === loja && !selecionados.includes(p))
    if (!candidato || selecionados.length === 0) return selecionados
    return [...selecionados.slice(0, -1), candidato]
}

const CHAVE_VISTOS = 'hh:loja:vistos'

/** Últimos produtos mostrados a este visitante (só no navegador dele; sem rastreio nem envio). */
function lerVistos(): number[] {
    try {
        const v = JSON.parse(localStorage.getItem(CHAVE_VISTOS) ?? '[]')
        return Array.isArray(v) ? v.filter((x): x is number => typeof x === 'number').slice(0, 15) : []
    } catch { return [] }
}

function guardarVistos(ids: number[]) {
    try { localStorage.setItem(CHAVE_VISTOS, JSON.stringify([...new Set(ids)].slice(0, 15))) } catch { /* modo privado/sem storage */ }
}

export function PrateleiraRotativa({ produtos, contexto, quantidade = 5 }: Props) {
    const [exibidos, setExibidos] = useState(() => garantirLoja(produtos.slice(0, quantidade), produtos, 'shopee'))

    useEffect(() => {
        const vistos = lerVistos()
        const sorteados = sortearPrateleira(produtos, quantidade, new Set(vistos))
        // Regra de negócio: a prateleira sempre representa a Shopee quando ela
        // tem produto disponível pro contexto — nunca some, mesmo que o sorteio não a tenha escolhido.
        const final = garantirLoja(sorteados, produtos, 'shopee')
        guardarVistos([...final.map(p => p.id), ...vistos])
        setExibidos(final)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sorteia uma vez por montagem (cada visualização da página), não a cada render
    }, [])

    const ref = useVitrineVista<HTMLDivElement>(contexto, exibidos.map(p => p.id))

    return (
        // 5 colunas no desktop (cartões ~250px, não 310px); o 5º some abaixo de lg para o celular e o tablet fecharem em 4.
        <div ref={ref} className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {exibidos.map((p, i) => <div key={p.id} className={`[&>*]:h-full ${i === 4 ? 'max-lg:hidden' : ''}`}><StoreCard product={p} contexto={contexto} /></div>)}
        </div>
    )
}
