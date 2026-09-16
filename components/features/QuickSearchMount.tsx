'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'
import { useQuickSearch } from '@/lib/hooks/useQuickSearch'

/**
 * O modal de busca só existe depois de um clique ou de ⌘K, mas era importado
 * estaticamente pelo NavBar — então entrava no bundle de toda página, junto com
 * o hook de busca e a renderização de resultados, competindo com a primeira
 * pintura em conexão móvel.
 *
 * Este wrapper fica no lugar dele e carrega só o que é barato: os atalhos de
 * teclado e o listener do evento global. O modal em si vira um chunk separado,
 * baixado no instante em que abre.
 */
const QuickSearch = dynamic(
    () => import('@/components/features/QuickSearch').then(m => ({ default: m.QuickSearch })),
    { ssr: false },
)

export function QuickSearchMount() {
    const isOpen = useQuickSearch(s => s.isOpen)
    const openModal = useQuickSearch(s => s.open)
    const closeModal = useQuickSearch(s => s.close)

    // Os atalhos precisam responder antes de o modal existir, então vivem aqui.
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                if (isOpen) closeModal()
                else openModal()
            }
            if (e.key === 'Escape' && isOpen) closeModal()
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [isOpen, openModal, closeModal])

    useEffect(() => {
        const handle = () => openModal()
        window.addEventListener('quick-search:open', handle)
        return () => window.removeEventListener('quick-search:open', handle)
    }, [openModal])

    if (!isOpen) return null
    return <QuickSearch />
}
