'use client'

import { useEffect, useState, useRef } from 'react'
import { IconWhatsApp } from '@/components/ui/SocialIcons'
import { trackShare } from '@/lib/analytics'

interface Props {
    shareUrl: string
}

export function BlogTextShare({ shareUrl }: Props) {
    const [popup, setPopup] = useState<{ x: number; y: number; text: string } | null>(null)
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        const onMouseUp = () => {
            if (hideTimer.current) clearTimeout(hideTimer.current)
            hideTimer.current = setTimeout(() => {
                const sel = window.getSelection()
                const text = sel?.toString().trim() ?? ''
                if (text.length < 10 || text.length > 280) { setPopup(null); return }
                const range = sel!.getRangeAt(0)
                const rect = range.getBoundingClientRect()
                setPopup({
                    x: rect.left + rect.width / 2 + window.scrollX,
                    y: rect.top + window.scrollY - 48,
                    text,
                })
            }, 200)
        }
        const onSelChange = () => {
            const sel = window.getSelection()
            if (!sel || sel.toString().trim().length === 0) setPopup(null)
        }
        document.addEventListener('mouseup', onMouseUp)
        document.addEventListener('selectionchange', onSelChange)
        return () => {
            document.removeEventListener('mouseup', onMouseUp)
            document.removeEventListener('selectionchange', onSelChange)
            if (hideTimer.current) clearTimeout(hideTimer.current)
        }
    }, [])

    if (!popup) return null

    const waUrl = `https://wa.me/?text=${encodeURIComponent(`"${popup.text}" — ${shareUrl}`)}`

    return (
        <div
            className="fixed z-300 flex items-center gap-1 bg-foreground px-2 py-1.5 shadow-xl"
            style={{ left: popup.x, top: popup.y, transform: 'translateX(-50%)' }}
        >
            <span className="text-[10px] font-semibold text-background/60 px-1 shrink-0">Compartilhar</span>
            <a href={waUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackShare({ rede: 'whatsapp_trecho', caminho: window.location.pathname })}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-background hover:text-green-400 transition-colors">
                <IconWhatsApp size={12} /> WhatsApp
            </a>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-foreground rotate-45" />
        </div>
    )
}
