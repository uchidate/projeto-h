'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookmarkCheck, BookOpen, Heart, PlayCircle, Trophy, User, LogOut, LogIn } from 'lucide-react'

export function UserMenu() {
    const { data: session, status } = useSession()
    const pathname = usePathname()
    const [open, setOpen] = useState(false)
    const [pos, setPos] = useState({ top: 0, right: 0 })
    const btnRef = useRef<HTMLButtonElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handle(e: MouseEvent) {
            if (
                btnRef.current && !btnRef.current.contains(e.target as Node) &&
                panelRef.current && !panelRef.current.contains(e.target as Node)
            ) setOpen(false)
        }
        document.addEventListener('mousedown', handle)
        return () => document.removeEventListener('mousedown', handle)
    }, [])

    function openMenu() {
        if (btnRef.current) {
            const r = btnRef.current.getBoundingClientRect()
            setPos({ top: r.bottom + 4, right: window.innerWidth - r.right })
        }
        setOpen(v => !v)
    }

    if (status === 'loading') return <div className="h-8 w-8 bg-surface animate-pulse" />

    if (!session) {
        const callbackUrl = pathname && pathname !== '/' ? `/entrar?callbackUrl=${encodeURIComponent(pathname)}` : '/entrar'
        return (
            <Link href={callbackUrl}
                aria-label="Entrar na sua conta"
                className="flex items-center gap-1.5 border border-border px-2.5 py-1.5 text-[12px] font-black uppercase tracking-wider text-muted hover:border-accent hover:text-accent transition-colors">
                <LogIn size={13} />
                <span className="hidden sm:inline">Entrar</span>
            </Link>
        )
    }

    const initial = session.user.name?.charAt(0).toUpperCase() ?? '?'

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                onClick={openMenu}
                className="flex h-8 w-8 items-center justify-center overflow-hidden border border-border bg-surface hover:border-accent transition-colors"
                aria-label="Menu do usuário"
            >
                {session.user.image ? (
                    <Image src={session.user.image} alt={session.user.name ?? ''} width={32} height={32} className="object-cover" />
                ) : (
                    <span className="text-[13px] font-black text-accent">{initial}</span>
                )}
            </button>

            {open && (
                <div
                    ref={panelRef}
                    className="fixed z-600 w-52 border border-border bg-background shadow-lg top-(--menu-top) right-(--menu-right)"
                    // @ts-expect-error CSS custom properties
                    style={{ '--menu-top': `${pos.top}px`, '--menu-right': `${pos.right}px` }}
                >
                    <div className="border-b border-border px-3 py-2.5">
                        <p className="text-[12px] font-black text-foreground truncate">{session.user.name}</p>
                        <p className="text-[10px] text-muted truncate">{session.user.email}</p>
                    </div>
                    <nav className="py-1">
                        {[
                            { href: '/dashboard',              label: 'Minha Onda',   icon: LayoutDashboard },
                            { href: '/perfil',                 label: 'Perfil',        icon: User           },
                            { href: '/conquistas',             label: 'Conquistas',    icon: Trophy         },
                            { href: '/minhas-listas',          label: 'Minhas listas', icon: Heart          },
                            { href: '/minhas-listas?tab=lista', label: 'Quero ver',    icon: BookmarkCheck  },
                            { href: '/minhas-listas?tab=assistindo', label: 'Assistindo', icon: PlayCircle },
                            { href: '/dashboard#leituras-salvas', label: 'Leituras', icon: BookOpen },
                        ].map(({ href, label, icon: Icon }) => (
                            <Link key={href} href={href} onClick={() => setOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-foreground hover:bg-surface hover:text-accent transition-colors">
                                <Icon size={13} className="text-muted" />
                                {label}
                            </Link>
                        ))}
                    </nav>
                    <div className="border-t border-border py-1">
                        <button type="button"
                            onClick={() => { setOpen(false); signOut({ callbackUrl: '/' }) }}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-muted hover:bg-surface hover:text-red-500 transition-colors">
                            <LogOut size={13} />
                            Sair
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
