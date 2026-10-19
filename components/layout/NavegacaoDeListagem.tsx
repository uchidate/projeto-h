'use client'

import { useEffect } from 'react'
import { exigeNavegacaoCompleta } from '@/lib/listagem/navegar'

/**
 * Clique em link de listagem com filtro/paginação (/productions?genre=…,
 * /blog?category=…, ?page=2) faz navegação completa em vez da do roteador:
 * ver lib/listagem/navegar.ts. Escuta na captura do document para rodar antes
 * do handler do <Link>, que ficaria com o payload sem filtro.
 */
export function NavegacaoDeListagem() {
    useEffect(() => {
        const aoClicar = (e: MouseEvent) => {
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
            const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
            if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return
            if (!exigeNavegacaoCompleta(a.href, window.location.origin)) return
            e.preventDefault()
            e.stopPropagation()
            window.location.assign(a.href)
        }
        document.addEventListener('click', aoClicar, true)
        return () => document.removeEventListener('click', aoClicar, true)
    }, [])
    return null
}
