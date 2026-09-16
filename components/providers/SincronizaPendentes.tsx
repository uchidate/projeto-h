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
import { lerPendentes, limparPendentes } from '@/lib/estadoPendente'
import { setContentState } from '@/lib/wordpress/userApi'

export function SincronizaPendentes() {
    const { data: session, status } = useSession()
    // A sincronização roda uma vez por sessão de página. Sem esta trava, uma
    // revalidação do next-auth (que reemite o objeto de sessão) dispararia a
    // fusão de novo e reenviaria tudo.
    const jaRodou = useRef(false)

    useEffect(() => {
        if (status !== 'authenticated' || !session?.user || jaRodou.current) return
        const pendentes = lerPendentes()
        if (pendentes.length === 0) return
        jaRodou.current = true

        let cancelado = false
        void (async () => {
            // Em série, de propósito: são no máximo algumas dezenas de itens, e
            // dispará-los em paralelo contra o WordPress no primeiro segundo
            // pós-login é o tipo de rajada que o throttle da própria API trata
            // como abuso.
            const sobraram = []
            for (const p of pendentes) {
                if (cancelado) return
                const ok = await setContentState(null, p.objectType, p.objectId, p.state)
                    .then(() => true)
                    .catch(() => false)
                if (!ok) sobraram.push(p)
            }
            if (cancelado) return

            // Só limpa o que foi de fato gravado. Limpar tudo no final trocaria
            // uma falha de rede pela perda silenciosa dos favoritos — o
            // resultado que este componente existe para evitar.
            limparPendentes()
            if (sobraram.length > 0) {
                try {
                    window.localStorage.setItem('hh-estado-pendente-v1', JSON.stringify(sobraram))
                } catch { /* sem storage: a próxima visita começa limpa */ }
                return
            }
            window.dispatchEvent(new CustomEvent('oc-content-state:sincronizado'))
        })()

        return () => { cancelado = true }
    }, [status, session])

    return null
}
