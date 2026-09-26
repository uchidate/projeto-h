'use client'

import { useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { getServerConsent, recusouConsentimento, subscribeConsent } from '@/lib/consent'
import { assinarRecentes, interpretarRecentes, lerRecentesCru } from '@/lib/artists/recentes'
import { escolherParaLeitor } from '@/lib/blog/destaque'

export interface CandidatoDestaque {
    slug: string
    categoria: string | null
    node: ReactNode
}

/**
 * Destaque da lista do blog escolhido para o leitor: entre os 3 melhores do dia, pula o que ele já
 * leu e favorece as categorias que ele mais lê (histórico só neste navegador, com a regra de
 * consentimento das demais listas). Sem histórico, ou sem consentimento, vale o padrão do servidor.
 * Os três já vêm renderizados no HTML: escolher é só mostrar um deles, sem buscar nada nem mudar a altura.
 */
export function BlogDestaque({ candidatos }: { candidatos: CandidatoDestaque[] }) {
    const cru = useSyncExternalStore(assinarRecentes, lerRecentesCru, () => '')
    const recusou = useSyncExternalStore(subscribeConsent, recusouConsentimento, () => getServerConsent() !== null)
    const indice = useMemo(() => {
        if (recusou) return 0
        const lidos = interpretarRecentes(cru).filter(r => r.tipo === 'artigo')
        return escolherParaLeitor(candidatos.map(c => ({ slug: c.slug, categoria: c.categoria })), lidos)
    }, [cru, recusou, candidatos])

    return (
        <>
            {candidatos.map((c, i) => (
                <div key={c.slug} hidden={i !== indice} data-bloco="blog-destaque" data-destaque-posicao={i + 1}>{c.node}</div>
            ))}
        </>
    )
}
