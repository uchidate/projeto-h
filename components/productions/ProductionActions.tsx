'use client'

import { useTranslations } from 'next-intl'
/* eslint-disable react-hooks/set-state-in-effect -- user lists hydrate after auth or local storage resolves */

import { useState, useEffect, useTransition } from 'react'
import { useSession } from 'next-auth/react'
import { Bookmark, CheckCircle2, Eye, Heart, ListChecks, LogIn, PlayCircle } from 'lucide-react'
import Link from 'next/link'
import { useLocalList } from '@/lib/hooks/useLocalList'
import {
    getProductionStatus,
    getUserFavorites,
    getUserWatchlist,
    setProductionStatus,
    toggleFavorite,
    type ProductionStatus,
} from '@/lib/wordpress/userApi'

interface Props {
    productionId: number
    mode?: 'all' | 'favorite' | 'watch'
    variant?: 'default' | 'hero'
}

export function ProductionActions({ productionId, mode = 'all', variant = 'default' }: Props) {
    const tc = useTranslations('client')
    const { data: session, status } = useSession()
    const localFav = useLocalList('oc_favorites')
    const localWatch = useLocalList('oc_watchlist')

    const [isFav, setIsFav] = useState(false)
    const [isWatch, setIsWatch] = useState(false)
    const [productionStatus, setLocalProductionStatus] = useState<ProductionStatus>('')
    const [ready, setReady] = useState(false)
    const [notice, setNotice] = useState('')
    const [noticeHref, setNoticeHref] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    // Carrega estado inicial
    useEffect(() => {
        if (status === 'loading') return
        if (session?.user) {
            Promise.all([
                getUserFavorites(),
                getUserWatchlist(),
                getProductionStatus(null, productionId).catch(() => ({ productionId, status: '' as ProductionStatus })),
            ]).then(([favs, watch, statusRes]) => {
                setIsFav(favs.includes(productionId))
                setIsWatch(watch.includes(productionId))
                setLocalProductionStatus(statusRes.status || (watch.includes(productionId) ? 'want' : ''))
                setReady(true)
            }).catch(() => setReady(true))
        } else if (localFav.ready) {
            setIsFav(localFav.has(productionId))
            setIsWatch(localWatch.has(productionId))
            setLocalProductionStatus(localWatch.has(productionId) ? 'want' : '')
            setReady(true)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recarrega o estado quando a sessão ou a produção mudam; localWatch/localFav são objetos novos a cada render e reexecutariam o efeito em laço
    }, [status, session, localFav.ready, productionId])

    function handleFav() {
        startTransition(async () => {
            setNotice('')
            setNoticeHref(null)
            if (session?.user) {
                const res = await toggleFavorite(null, productionId).catch(() => null)
                if (res) {
                    setIsFav(res.action === 'added')
                    setNotice(res.action === 'added' ? tc('production.addedFav') : tc('production.removedFav'))
                    setNoticeHref(res.action === 'added' ? '/minhas-listas?tab=favoritos' : null)
                } else {
                    setNotice(tc('common.syncFailed'))
                }
            } else {
                const next = !isFav
                localFav.toggle(productionId)
                setIsFav(next)
                setNotice(next ? tc('production.savedFavLocal') : tc('production.removedFavLocal'))
                setNoticeHref(null)
            }
        })
    }

    function handleWatch() {
        startTransition(async () => {
            setNotice('')
            setNoticeHref(null)
            const nextStatus: ProductionStatus = isWatch ? '' : 'want'
            if (session?.user) {
                const res = await setProductionStatus(null, productionId, nextStatus).catch(() => null)
                if (res) {
                    setIsWatch(res.status === 'want')
                    setLocalProductionStatus(res.status)
                    setNotice(res.status === 'want' ? tc('production.addedWant') : tc('production.removedWant'))
                    setNoticeHref(res.status === 'want' ? '/minhas-listas?tab=lista' : null)
                } else {
                    setNotice(tc('common.syncFailed'))
                }
            } else {
                const next = !isWatch
                localWatch.toggle(productionId)
                setIsWatch(next)
                setLocalProductionStatus(next ? 'want' : '')
                setNotice(next ? tc('production.savedWantLocal') : tc('production.removedLocal'))
                setNoticeHref(null)
            }
        })
    }

    function handleStatus(nextStatus: ProductionStatus) {
        startTransition(async () => {
            setNotice('')
            setNoticeHref(null)
            if (!session?.user) return

            const statusToSave = productionStatus === nextStatus ? '' : nextStatus
            const res = await setProductionStatus(null, productionId, statusToSave).catch(() => null)
            if (!res) {
                setNotice(tc('common.syncFailed'))
                return
            }

            setLocalProductionStatus(res.status)
            setIsWatch(res.status === 'want')
            if (res.status === 'want') {
                setNotice(tc('production.markedWant'))
                setNoticeHref('/minhas-listas?tab=lista')
            } else if (res.status === 'watching') {
                setNotice(tc('production.markedWatching'))
                setNoticeHref('/minhas-listas?tab=assistindo')
            } else if (res.status === 'watched') {
                setNotice(tc('production.markedWatched'))
                setNoticeHref('/minhas-listas?tab=assistidos')
            } else {
                setNotice(tc('production.statusRemoved'))
            }
        })
    }

    if (!ready && status !== 'unauthenticated') return null

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
                {mode !== 'watch' && <button
                    type="button"
                    onClick={handleFav}
                    disabled={isPending}
                    aria-label={isFav ? tc('production.removeFav') : tc('production.addFav')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold border transition-colors disabled:opacity-60
                    ${isFav
                        ? 'bg-accent-a11y border-accent-a11y text-white'
                        : 'border-border text-muted hover:border-accent hover:text-accent'
                    }`}
                >
                    <Heart size={13} fill={isFav ? 'currentColor' : 'none'} />
                    {isFav ? 'Favoritado' : 'Favoritar'}
                </button>}

                {mode !== 'favorite' && <button
                    type="button"
                    onClick={handleWatch}
                    disabled={isPending}
                    aria-label={isWatch ? tc('production.removeList') : tc('production.addList')}
                    className={`flex items-center gap-1.5 font-bold border transition-colors disabled:opacity-60
                    ${variant === 'hero'
                        ? `rounded-lg px-5 py-3 text-[11px] ${isWatch ? 'border-white bg-white text-black' : 'border-white/25 bg-white/90 text-black hover:bg-white'}`
                        : `px-3 py-1.5 text-[12px] ${isWatch ? 'bg-foreground border-foreground text-background' : 'border-border text-muted hover:border-foreground hover:text-foreground'}`
                    }`}
                >
                    <Bookmark size={13} fill={isWatch ? 'currentColor' : 'none'} />
                    {isWatch ? tc('production.inList') : variant === 'hero' ? tc('production.addList') : tc('production.want')}
                </button>}

                {status === 'unauthenticated' && variant !== 'hero' && (
                    <Link href={`/entrar?callbackUrl=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '')}`}
                        className="flex items-center gap-1 text-[11px] text-muted hover:text-accent transition-colors">
                        <LogIn size={11} /> {tc('common.signInToSync')}
                    </Link>
                )}
            </div>

            {session?.user && variant !== 'hero' && (
                <div className="flex flex-wrap items-center gap-1.5 border border-border bg-surface p-1.5">
                    {([
                        { id: 'want', label: tc('production.want'), icon: ListChecks },
                        { id: 'watching', label: tc('production.watching'), icon: PlayCircle },
                        { id: 'watched', label: tc('production.watched'), icon: Eye },
                    ] as const).map(({ id, label, icon: Icon }) => {
                        const active = productionStatus === id
                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => handleStatus(id)}
                                disabled={isPending}
                                aria-pressed={active}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-black transition-colors disabled:opacity-60 ${active
                                    ? 'bg-accent-a11y text-white'
                                    : 'bg-background text-muted hover:text-foreground'
                                }`}
                            >
                                <Icon size={12} />
                                {label}
                            </button>
                        )
                    })}
                </div>
            )}

            {notice && variant !== 'hero' && (
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-muted" role="status" aria-live="polite">
                    <span className="inline-flex items-center gap-1 text-foreground">
                        <CheckCircle2 size={12} className="text-accent" /> {notice}
                    </span>
                    {noticeHref && (
                        <Link href={noticeHref} className="text-accent hover:underline">
                            {tc('production.seeInList')}
                        </Link>
                    )}
                </div>
            )}
        </div>
    )
}
