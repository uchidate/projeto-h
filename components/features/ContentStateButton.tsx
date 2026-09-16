'use client'

import { useTranslations } from 'next-intl'
/* eslint-disable react-hooks/set-state-in-effect -- remote state hydrates after the session resolves */

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { BellPlus, BookmarkPlus, CheckCircle2, Heart, LogIn } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { getContentState, setContentState, type ContentObjectType, type ContentState } from '@/lib/wordpress/userApi'
import { alternarPendente, estaPendente } from '@/lib/estadoPendente'
import { trackConteudoMarcado } from '@/lib/analytics'

interface Props {
    objectId: number
    objectType: ContentObjectType
    state?: Exclude<ContentState, ''>
    label?: string
    activeLabel?: string
    signedOutLabel?: string
    variant?: 'light' | 'dark'
}

export function ContentStateButton({
    objectId,
    objectType,
    state = 'following',
    label: labelProp,
    activeLabel: activeLabelProp,
    // Agora é o texto do convite que aparece DEPOIS de salvar, não o rótulo
    // de um botão que só levava ao login.
    signedOutLabel: signedOutLabelProp,
    variant = 'light',
}: Props) {
    const tc = useTranslations('client')
    const label = labelProp ?? tc('follow.follow')
    const activeLabel = activeLabelProp ?? tc('follow.following')
    const signedOutLabel = signedOutLabelProp ?? tc('follow.signedOut')
    const { data: session, status } = useSession()
    const [currentState, setCurrentState] = useState<ContentState>('')
    const [ready, setReady] = useState(false)
    const [notice, setNotice] = useState('')
    const [isPending, startTransition] = useTransition()
    const active = currentState === state

    useEffect(() => {
        if (status === 'loading') return
        if (!session?.user) {
            // Sem conta o estado vem do navegador. Antes esta tela era um
            // convite a logar; agora o clique funciona e a conta é oferecida
            // depois, para não perder o que já foi guardado.
            setCurrentState(estaPendente(objectType, objectId, state) ? state : '')
            setReady(true)
            return
        }
        getContentState(null, objectType, objectId, state)
            .then(res => setCurrentState(res.state))
            .catch(() => null)
            .finally(() => setReady(true))
    }, [status, session, objectType, objectId, state])

    useEffect(() => {
        function handleStateChanged(event: Event) {
            const detail = (event as CustomEvent<{
                objectId: number
                objectType: ContentObjectType
                state: ContentState
                removeState?: ContentState
            }>).detail
            if (!detail || detail.objectId !== objectId || detail.objectType !== objectType) return

            if (detail.state === state) {
                setCurrentState(state)
            } else if (detail.removeState === state) {
                setCurrentState('')
            } else if (objectType === 'post' && state === 'saved' && detail.state === 'read') {
                setCurrentState('')
            } else if (objectType === 'post' && state === 'read' && detail.state === 'saved') {
                setCurrentState('')
            }
        }

        window.addEventListener('oc-content-state:changed', handleStateChanged)
        return () => window.removeEventListener('oc-content-state:changed', handleStateChanged)
    }, [objectId, objectType, state])

    function handleClick() {
        if (!session?.user) {
            const ligado = alternarPendente(objectType, objectId, state)
            trackConteudoMarcado({ tipo: objectType, estado: state, acao: ligado ? 'adicionar' : 'remover', comConta: false })
            setCurrentState(ligado ? state : '')
            setNotice(ligado ? 'Salvo neste dispositivo.' : 'Removido.')
            window.dispatchEvent(new CustomEvent('oc-content-state:changed', {
                detail: { objectId, objectType, state: ligado ? state : '', removeState: ligado ? undefined : state },
            }))
            return
        }
        startTransition(async () => {
            setNotice('')
            const next = active ? '' : state
            const res = await setContentState(null, objectType, objectId, next, state).catch(() => null)
            if (!res) {
                setNotice(tc('common.syncFailed'))
                return
            }
            setCurrentState(res.state)
            trackConteudoMarcado({ tipo: objectType, estado: state, acao: res.state ? 'adicionar' : 'remover', comConta: true })
            window.dispatchEvent(new CustomEvent('oc-content-state:changed', {
                detail: { objectId, objectType, state: res.state, removeState: active ? state : undefined },
            }))
            setNotice(res.state ? 'Atualizado na Minha Onda.' : 'Removido da Minha Onda.')
        })
    }

    const callbackUrl = typeof window !== 'undefined' ? window.location.pathname : '/'

    if (!ready && status !== 'unauthenticated') {
        return <span className="touch-target inline-flex w-24 animate-pulse bg-surface" />
    }

    const Icon = state === 'favorite' ? Heart : state === 'saved' ? BookmarkPlus : BellPlus

    return (
        <div className="flex flex-wrap items-center gap-2">
            <button
                type="button"
                onClick={handleClick}
                disabled={isPending}
                aria-pressed={active}
                className={`touch-target inline-flex items-center gap-1.5 border px-3 py-2 text-[11px] font-black uppercase tracking-wider transition-colors disabled:opacity-60 ${active
                    ? 'border-accent-a11y bg-accent-a11y text-white'
                    : variant === 'dark'
                        ? 'border-white/20 bg-black/35 text-white/75 hover:border-white hover:text-white'
                        : 'border-border text-muted hover:border-accent hover:text-accent'
                }`}
            >
                {active ? <CheckCircle2 size={12} /> : <Icon size={12} />}
                {active ? activeLabel : label}
            </button>
            {notice && variant !== 'dark' && (
                <span className="text-[11px] font-semibold text-muted" role="status" aria-live="polite">{notice}</span>
            )}
            {/*
              * O convite a criar conta só aparece DEPOIS do primeiro clique, e
              * só para quem não tem sessão. É a diferença toda: o pedido passa
              * a proteger algo que o visitante já guardou, em vez de cobrar
              * antes de ele ter qualquer motivo.
              */}
            {!session && active && (
                <Link
                    href={`/entrar?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold underline underline-offset-2 ${variant === 'dark' ? 'text-white/80 hover:text-white' : 'text-muted hover:text-accent'
                        }`}
                >
                    <LogIn size={11} /> {signedOutLabel}
                </Link>
            )}
        </div>
    )
}
