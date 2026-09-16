'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { Bell, Check, X } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { getUserNotifications, markAllUserNotificationsRead, updateUserNotification, type UserNotification } from '@/lib/wordpress/userApi'

export function NotificationBell() {
    const { data: session, status } = useSession()
    const [open, setOpen] = useState(false)
    const [items, setItems] = useState<UserNotification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isPending, startTransition] = useTransition()
    const btnRef = useRef<HTMLButtonElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!session?.user) return
        getUserNotifications()
            .then(res => {
                setItems(res.items)
                setUnreadCount(res.unreadCount)
            })
            .catch(() => null)
    }, [session])

    useEffect(() => {
        function handleClick(event: MouseEvent) {
            if (
                btnRef.current && !btnRef.current.contains(event.target as Node) &&
                panelRef.current && !panelRef.current.contains(event.target as Node)
            ) setOpen(false)
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    if (status !== 'authenticated' || !session?.user) return null

    function typeLabel(type: string) {
        if (type === 'saved_reading') return 'Leitura salva'
        if (type === 'continue_watching') return 'Assistindo'
        return 'Minha Onda'
    }

    function updateNotification(id: string, action: 'read' | 'dismiss') {
        if (!session?.user) return
        startTransition(async () => {
            const res = await updateUserNotification(null, id, action).catch(() => null)
            if (!res) return
            setItems(res.items)
            setUnreadCount(res.unreadCount)
        })
    }

    function markAllRead() {
        if (!session?.user) return
        startTransition(async () => {
            const res = await markAllUserNotificationsRead().catch(() => null)
            if (!res) return
            setItems(res.items)
            setUnreadCount(res.unreadCount)
        })
    }

    return (
        <div className="relative">
            <button
                ref={btnRef}
                type="button"
                onClick={() => setOpen(value => !value)}
                className="relative flex h-9 w-9 items-center justify-center border border-transparent text-muted transition-colors hover:border-border hover:bg-surface hover:text-foreground"
                aria-label="Notificações"
            >
                <Bell size={17} />
                {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center bg-accent-a11y px-1 text-[9px] font-black leading-none text-white">
                        {Math.min(unreadCount, 9)}
                    </span>
                )}
            </button>

            {open && (
                <div ref={panelRef} className="absolute right-0 top-[calc(100%+6px)] z-610 w-[320px] border border-border bg-background shadow-lg">
                    <div className="border-b border-border px-3 py-2.5">
                        <div className="flex items-start justify-between gap-3">
                            <span>
                                <p className="text-[12px] font-black text-foreground">Notificações</p>
                                <p className="text-[10px] text-muted">Só alertas ligados à sua Minha Onda.</p>
                            </span>
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={markAllRead}
                                    className="shrink-0 text-[10px] font-black uppercase tracking-wider text-accent hover:underline disabled:opacity-60"
                                >
                                    Ler tudo
                                </button>
                            )}
                        </div>
                    </div>
                    {items.length === 0 ? (
                        <p className="p-4 text-[13px] text-muted">Nada importante agora.</p>
                    ) : (
                        <div className="max-h-[360px] overflow-y-auto py-1">
                            {items.map(item => (
                                <div key={item.id} className="border-b border-border/60 p-3 last:border-b-0">
                                    <Link
                                        href={item.href}
                                        onClick={() => {
                                            setOpen(false)
                                            if (!item.readAt) updateNotification(item.id, 'read')
                                        }}
                                        className="group block"
                                    >
                                        <span className="mb-1 flex items-center gap-2">
                                            {!item.readAt && <span className="h-1.5 w-1.5 shrink-0 bg-accent" />}
                                            <span className="text-[12px] font-black text-foreground group-hover:text-accent">{item.title}</span>
                                        </span>
                                        <span className="mb-1 inline-flex border border-border px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-muted">
                                            {typeLabel(item.type)}
                                        </span>
                                        <span className="block text-[12px] leading-snug text-muted">{item.body}</span>
                                    </Link>
                                    <div className="mt-2 flex items-center gap-2">
                                        {!item.readAt && (
                                            <button
                                                type="button"
                                                disabled={isPending}
                                                onClick={() => updateNotification(item.id, 'read')}
                                                className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-muted hover:text-accent disabled:opacity-60"
                                            >
                                                <Check size={11} /> Lida
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            disabled={isPending}
                                            onClick={() => updateNotification(item.id, 'dismiss')}
                                            className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-muted hover:text-red-500 disabled:opacity-60"
                                        >
                                            <X size={11} /> Dispensar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
