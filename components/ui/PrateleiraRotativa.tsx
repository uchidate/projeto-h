'use client'
/* eslint-disable react-hooks/set-state-in-effect -- sorteio depende de Math.random(), que não pode rodar durante a renderização (SSR determinístico) */

import { useEffect, useState } from 'react'
import type { StoreProduct } from '@/lib/wordpress/store'
import { sortearComDescoberta } from '@/lib/wordpress/store-rotacao'
import { garantirLoja } from '@/lib/wordpress/garantir-loja'
import { StoreCard } from '@/components/ui/StoreCard'
import { useVitrineVista } from '@/components/ui/VitrineVista'

interface Props {
    /** Já vem ordenado (aderência > destaque > desconto > CTR/comissão > posição) — o sorteio só escolhe quais aparecem. */
    produtos: StoreProduct[]
    /** Produtos que o ranking ainda não leu: um deles ocupa o slot de descoberta (ver store-rotacao). Opcional. */
    descobertas?: StoreProduct[]
    contexto: string
    quantidade?: number
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
export function PrateleiraRotativa({ produtos, descobertas = [], contexto, quantidade = 5 }: Props) {
    const [exibidos, setExibidos] = useState(() => garantirLoja(produtos.slice(0, quantidade), produtos, 'shopee', 1))

    useEffect(() => {
        const vistos = lerVistos()
        const sorteados = sortearComDescoberta(produtos, descobertas, quantidade, new Set(vistos))
        // Regra de negócio: a prateleira sempre representa a Shopee quando ela
        // tem produto disponível pro contexto — nunca some, mesmo que o sorteio não a tenha escolhido.
        const final = garantirLoja(sorteados, produtos, 'shopee', 1)
        guardarVistos([...final.map(p => p.id), ...vistos])
        setExibidos(final)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sorteia uma vez por montagem (cada visualização da página), não a cada render
    }, [])

    const ref = useVitrineVista<HTMLDivElement>(contexto, exibidos.map(p => p.id), exibidos.filter(p => p.descoberta).map(p => p.id))

    return (
        // Celular: fileira que rola para o lado (~1 cartão de altura); antes a grade 2×2 ocupava ~700 px no fim da ficha.
        // Tablet: 4 colunas (o 5º some); desktop: 5 colunas (cartões ~250px, não 310px).
        <div ref={ref} className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:thin] sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0 lg:grid-cols-5">
            {exibidos.map((p, i) => <div key={p.id} className={`w-[44%] shrink-0 snap-start sm:w-auto [&>*]:h-full ${i === 4 ? 'sm:max-lg:hidden' : ''}`}><StoreCard product={p} contexto={contexto} /></div>)}
        </div>
    )
}
