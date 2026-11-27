'use client'

/**
 * Leva para a conta o que foi favoritado antes dela existir.
 *
 * Sem isto, deixar o visitante favoritar sem conta seria uma promessa quebrada:
 * ele clica, cria a conta por causa do aviso "entre para não perder" — e chega
 * numa Minha Onda vazia, tendo perdido exatamente o que o convite prometia
 * guardar. A fusão é o que torna o item anterior honesto.
 */

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { lerPendentes, removerPendente } from '@/lib/estadoPendente'
import { setContentState } from '@/lib/wordpress/userApi'

export function SincronizaPendentes() {
    const { data: session, status } = useSession()
    // A sincronização roda uma vez por sessão de página. Sem esta trava, uma
    // revalidação do next-auth (que reemite o objeto de sessão) dispararia a
    // fusão de novo e reenviaria tudo.
    const jaRodou = useRef(false)
    // Só a saída do componente interrompe a fusão. Cancelar na limpeza do efeito
    // abaixo parava tudo no meio quando a sessão era revalidada (voltar à aba já
    // basta), e a trava acima impedia retomar.
    const montado = useRef(false)

    useEffect(() => {
        montado.current = true
        return () => { montado.current = false }
    }, [])

    useEffect(() => {
        if (status !== 'authenticated' || !session?.user || jaRodou.current) return
        const pendentes = lerPendentes()
        if (pendentes.length === 0) return
        jaRodou.current = true

        void (async () => {
            // Em série, de propósito: são no máximo algumas dezenas de itens, e
            // dispará-los em paralelo contra o WordPress no primeiro segundo
            // pós-login é o tipo de rajada que o throttle da própria API trata
            // como abuso.
            for (const p of pendentes) {
                if (!montado.current) return
                const ok = await setContentState(null, p.objectType, p.objectId, p.state)
                    .then(() => true)
                    .catch(() => false)
                // Só sai do navegador o que a conta confirmou, um a um: fechar a
                // aba ou falhar a rede não perde favorito.
                if (!ok) continue
                removerPendente(p.objectType, p.objectId, p.state)
                // Botões já na tela consultaram a conta antes desta gravação.
                window.dispatchEvent(new CustomEvent('oc-content-state:changed', {
                    detail: { objectId: p.objectId, objectType: p.objectType, state: p.state },
                }))
            }
        })()
    }, [status, session])

    return null
}
