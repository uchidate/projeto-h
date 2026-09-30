'use client'
/* eslint-disable react-hooks/set-state-in-effect -- sorteio depende de Math.random(), que não pode rodar durante a renderização (SSR determinístico) */

import { useEffect, useState } from 'react'
import type { StoreProduct } from '@/lib/wordpress/store'
import { calcularDesconto } from '@/lib/wordpress/store'
import { StoreCard } from '@/components/ui/StoreCard'

interface Props {
    /** Já vem ordenado (destaque > desconto > CTR > posição) — só reembaralha aqui. */
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
 * Destaque/desconto real são sinal editorial e comercial, não aleatorizado:
 * ficam fixos. Só o resto do pool concorre por sorteio PONDERADO pela posição
 * no ranking (que já embute CTR) — o melhor aparece mais, mas não sempre.
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

export function PrateleiraRotativa({ produtos, contexto, quantidade = 4 }: Props) {
    const [exibidos, setExibidos] = useState(() => garantirLoja(produtos.slice(0, quantidade), produtos, 'shopee'))

    useEffect(() => {
        const fixos = produtos.filter(p => p.acf.featured || calcularDesconto(p.acf.price, p.acf.original_price) !== null)
        const resto = produtos.filter(p => !fixos.includes(p))
        const fixosExibidos = fixos.slice(0, quantidade)
        const vagas = quantidade - fixosExibidos.length

        const pool = [...resto]
        const sorteados: StoreProduct[] = []
        for (let i = 0; i < vagas && pool.length > 0; i++) {
            const pesos = pool.map((_, idx) => 1 / (idx + 1))
            const total = pesos.reduce((a, b) => a + b, 0)
            let alvo = Math.random() * total
            let escolhido = 0
            for (; escolhido < pesos.length; escolhido++) {
                alvo -= pesos[escolhido]
                if (alvo <= 0) break
            }
            sorteados.push(pool.splice(Math.min(escolhido, pool.length - 1), 1)[0])
        }

        // Regra de negócio: a prateleira sempre representa a Shopee quando ela
        // tem produto disponível pro contexto — nunca some, mesmo que o
        // sorteio por CTR não a tenha escolhido.
        setExibidos(garantirLoja([...fixosExibidos, ...sorteados], produtos, 'shopee'))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sorteia uma vez por montagem (cada visualização da página), não a cada render
    }, [])

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {exibidos.map(p => <StoreCard key={p.id} product={p} contexto={contexto} />)}
        </div>
    )
}
