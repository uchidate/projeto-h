'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

export function BlogBackToTop() {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const onScroll = () => {
            const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)
            setVisible(pct > 0.35)
        }
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    return (
        <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Voltar ao topo"
            className={`fixed bottom-[calc(var(--bottom-nav-h,62px)+12px)] right-4 z-200 flex h-10 w-10 items-center justify-center border border-border bg-background text-muted shadow-md transition-all duration-300 hover:border-accent hover:text-accent lg:bottom-6 lg:right-6 ${visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-3 pointer-events-none'}`}
        >
            <ArrowUp className="h-4 w-4" />
        </button>
    )
}
