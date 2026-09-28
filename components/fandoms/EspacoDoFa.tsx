'use client'
/* eslint-disable react-hooks/set-state-in-effect -- remote/pendente state hydrates depois que a sessão resolve, mesmo padrão do ContentStateButton */

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { getUserContentStates, setContentState } from '@/lib/wordpress/userApi'
import { estaPendente, alternarPendente, lerPendentes } from '@/lib/estadoPendente'
import { contorno, tinta } from '@/lib/fandoms/cor'

export interface CartaoTorcida {
    slug: string
    nome: string
    cor: string
    /** Nomes dos grupos da torcida (o primeiro é o principal). */
    grupos: string[]
    grupoSlug: string | null
    /** ID do post do grupo principal no WordPress — é o que liga a torcida ao "seguir grupo" da conta. */
    grupoId: number | null
    foto: string | null
    ano: number | null
    encerrado: boolean
    /** Dias até a próxima estreia comemorada (aniversário do grupo), se houver uma perto. */
    diasProximaData: number | null
}

const SOMBRA = 'shadow-[5px_5px_0_#15102b] dark:shadow-[5px_5px_0_#000]'
const SOMBRA_G = 'shadow-[7px_7px_0_#15102b] dark:shadow-[7px_7px_0_#000]'
// Torcidas para quem ainda não escolheu nenhuma: as mais conhecidas, se existirem na lista.
const DESTAQUES = ['ARMY', 'BLINK', 'ONCE', 'STAY']
const MAX_EXIBIDAS = 6

/**
 * "Sou dessa torcida" É "seguir o grupo principal da torcida" — a mesma marcação que
 * aparece na ficha do grupo (ContentStateButton). Sem conta, o clique fica pendente no
 * navegador (lib/estadoPendente) e é fundido na conta no login, do mesmo jeito que
 * favoritos e "seguir artista" já funcionam. Isso substitui o antigo `hh:torcidas`
 * (só no navegador, nunca sincronizava) por um único sistema de conta pro site inteiro.
 */
function useTorcidasEscolhidas() {
    const { data: session, status } = useSession()
    const [idsEscolhidos, setIdsEscolhidos] = useState<number[]>([])
    const [pronto, setPronto] = useState(false)

    useEffect(() => {
        if (status === 'loading') return
        if (!session?.user) {
            setIdsEscolhidos(lerPendentes().filter(p => p.objectType === 'group' && p.state === 'following').map(p => p.objectId))
            setPronto(true)
            return
        }
        let vivo = true
        getUserContentStates(null)
            .then(res => {
                if (!vivo) return
                setIdsEscolhidos(res.states.filter(s => s.objectType === 'group' && s.state === 'following').map(s => s.objectId))
            })
            .catch(() => {})
            .finally(() => { if (vivo) setPronto(true) })
        return () => { vivo = false }
    }, [status, session])

    // Duas mãos: seguir um grupo direto na ficha dele também atualiza aqui, sem recarregar.
    useEffect(() => {
        function aoMudar(event: Event) {
            const detail = (event as CustomEvent<{ objectId: number; objectType: string; state: string; removeState?: string }>).detail
            if (!detail || detail.objectType !== 'group') return
            if (detail.state === 'following') {
                setIdsEscolhidos(prev => prev.includes(detail.objectId) ? prev : [...prev, detail.objectId])
            } else if (detail.removeState === 'following') {
                setIdsEscolhidos(prev => prev.filter(id => id !== detail.objectId))
            }
        }
        window.addEventListener('oc-content-state:changed', aoMudar)
        return () => window.removeEventListener('oc-content-state:changed', aoMudar)
    }, [])

    const alternar = useCallback((grupoId: number) => {
        const ativo = idsEscolhidos.includes(grupoId)
        if (!session?.user) {
            const ligou = alternarPendente('group', grupoId, 'following')
            setIdsEscolhidos(prev => ligou ? [...prev, grupoId] : prev.filter(id => id !== grupoId))
            window.dispatchEvent(new CustomEvent('oc-content-state:changed', {
                detail: { objectId: grupoId, objectType: 'group', state: ligou ? 'following' : '', removeState: ligou ? undefined : 'following' },
            }))
            return
        }
        setContentState(null, 'group', grupoId, ativo ? '' : 'following', 'following')
            .then(res => {
                setIdsEscolhidos(prev => res.state ? (prev.includes(grupoId) ? prev : [...prev, grupoId]) : prev.filter(id => id !== grupoId))
                window.dispatchEvent(new CustomEvent('oc-content-state:changed', {
                    detail: { objectId: grupoId, objectType: 'group', state: res.state, removeState: ativo ? 'following' : undefined },
                }))
            })
            .catch(() => {})
    }, [idsEscolhidos, session])

    return { idsEscolhidos, alternar, pronto }
}

/** Selo "aniversário perto" nos cartões da grade — só quando há uma estreia comemorada nos próximos 14 dias. */
function SeloData({ dias }: { dias: number | null }) {
    if (dias == null) return null
    const texto = dias === 0 ? 'hoje 🎂' : dias === 1 ? 'amanhã 🎂' : `em ${dias}d 🎂`
    return <span className="mt-1 block text-[11px] font-black">{texto}</span>
}

function BotaoSou({ grupoId, marcada, onAlternar, cor }: { grupoId: number | null; marcada: boolean; onAlternar: (grupoId: number) => void; cor: string }) {
    if (grupoId == null) return null
    return (
        <button type="button" aria-pressed={marcada} onClick={e => { e.preventDefault(); e.stopPropagation(); onAlternar(grupoId) }}
            className="touch-target px-2.5 py-1.5 text-[11px] font-black"
            style={{ background: marcada ? '#15102b' : 'rgba(255,255,255,0.75)', color: marcada ? '#fff' : '#15102b' }}
            title={marcada ? 'Tirar das minhas torcidas' : 'Sou dessa torcida'}>
            {marcada ? '✓ Sou dessa' : '＋ Sou dessa'}
            <span className="sr-only"> {cor}</span>
        </button>
    )
}

/** Botão "Sou dessa torcida" da página de cada fandom: é o mesmo "seguir grupo" da conta. */
export function BotaoTorcida({ grupoId, ink, cor }: { grupoId: number | null; ink: string; cor: string }) {
    const { data: session, status } = useSession()
    const [marcada, setMarcada] = useState(false)
    const [pronto, setPronto] = useState(false)

    useEffect(() => {
        if (grupoId == null || status === 'loading') return
        if (!session?.user) {
            setMarcada(estaPendente('group', grupoId, 'following'))
            setPronto(true)
            return
        }
        let vivo = true
        getUserContentStates(null)
            .then(res => { if (vivo) setMarcada(res.states.some(s => s.objectType === 'group' && s.objectId === grupoId && s.state === 'following')) })
            .catch(() => {})
            .finally(() => { if (vivo) setPronto(true) })
        return () => { vivo = false }
    }, [grupoId, status, session])

    if (grupoId == null) return null

    const alternar = () => {
        if (!session?.user) {
            setMarcada(alternarPendente('group', grupoId, 'following'))
            return
        }
        setContentState(null, 'group', grupoId, marcada ? '' : 'following', 'following')
            .then(res => setMarcada(!!res.state))
            .catch(() => {})
    }

    return (
        <button type="button" aria-pressed={marcada} onClick={alternar} disabled={!pronto}
            className="touch-target inline-flex items-center px-5 py-3 text-[14px] font-black disabled:opacity-60"
            style={marcada ? { background: '#ffe14d', color: '#15102b' } : { background: ink, color: cor }}>
            {marcada ? '✓ Sua torcida' : '＋ Sou dessa torcida'}
        </button>
    )
}

interface Artigo { slug: string; titulo: string; foto: string | null; data: string }
interface DataProxima { tipo: 'estreia' | 'aniversario'; quem: string; dia: string; dias: number; anos: number }

/** Últimos artigos e próximas datas da torcida. Cada bloco some sozinho se não houver dado ou se a consulta falhar. */
function Novidades({ torcidaSlug, ink }: { torcidaSlug: string; ink: string }) {
    const [artigos, setArtigos] = useState<Artigo[]>([])
    const [datas, setDatas] = useState<DataProxima[]>([])
    useEffect(() => {
        let vivo = true
        fetch(`/api/fandoms/novidades?torcida=${encodeURIComponent(torcidaSlug)}`)
            .then(r => (r.ok ? r.json() : { artigos: [], datas: [] }))
            .then(d => {
                if (!vivo) return
                if (Array.isArray(d.artigos)) setArtigos(d.artigos.slice(0, 2))
                if (Array.isArray(d.datas)) setDatas(d.datas.slice(0, 2))
            })
            .catch(() => {})
        return () => { vivo = false }
    }, [torcidaSlug])
    if (artigos.length === 0 && datas.length === 0) return null
    const quando = (d: DataProxima) => (d.dias === 0 ? 'hoje' : d.dias === 1 ? 'amanhã' : `em ${d.dias} dias`)
    return (
        <div className="space-y-4">
            {datas.length > 0 && (
                <div className="border-t-2 pt-4" style={{ borderColor: `${ink}55` }}>
                    <p className="text-[12px] font-black uppercase tracking-[0.1em]">Próximas datas 🎂</p>
                    <ul className="mt-2 space-y-1.5">
                        {datas.map(d => (
                            <li key={`${d.tipo}-${d.quem}`} className="text-[15px] font-bold leading-snug">
                                {d.tipo === 'estreia' ? `${d.quem} completa ${d.anos} ${d.anos === 1 ? 'ano' : 'anos'} de estreia` : `${d.quem} faz ${d.anos} anos`}
                                <span className="font-medium opacity-80"> · {d.dia}, {quando(d)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {artigos.length > 0 && (
                <div className="border-t-2 pt-4" style={{ borderColor: `${ink}55` }}>
                    <p className="text-[12px] font-black uppercase tracking-[0.1em]">Novidades</p>
                    <ul className="mt-2 space-y-2">
                        {artigos.map(a => (
                            <li key={a.slug}>
                                <Link href={`/blog/${a.slug}`} className="block text-[15px] font-bold leading-snug underline-offset-2 hover:underline">{a.titulo}</Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}

/** Espaço do fã: escolher a(s) torcida(s), um painel só delas e o catálogo completo em cartões coloridos. */
export function EspacoDoFa({ cartoes, busca }: { cartoes: CartaoTorcida[]; busca?: string }) {
    const { data: session } = useSession()
    const { idsEscolhidos, alternar } = useTorcidasEscolhidas()
    const escolhidas = useMemo(() => cartoes.filter(c => c.grupoId != null && idsEscolhidos.includes(c.grupoId)).map(c => c.slug), [cartoes, idsEscolhidos])
    const porSlug = useMemo(() => new Map(cartoes.map(c => [c.slug, c])), [cartoes])
    const minhas = escolhidas.map(s => porSlug.get(s)).filter((c): c is CartaoTorcida => !!c).slice(0, MAX_EXIBIDAS)
    const destaques = useMemo(() => DESTAQUES.map(n => cartoes.find(c => c.nome.toUpperCase() === n)).filter((c): c is CartaoTorcida => !!c), [cartoes])
    const resto = cartoes.filter(c => !escolhidas.includes(c.slug))

    return (
        <div>
            {minhas.length > 0 && (
                <section aria-labelledby="minhas-titulo" className="mb-12">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <h2 id="minhas-titulo" className="font-[family-name:var(--font-playfair)] text-[28px] font-extrabold sm:text-[34px]">Sua torcida 💜</h2>
                        {session?.user && (
                            <Link href="/perfil" className="text-[13px] font-black underline underline-offset-2">Ver no seu perfil →</Link>
                        )}
                    </div>
                    <div className="mt-5 grid gap-5 md:grid-cols-2">
                        {minhas.map(c => {
                            const ink = tinta(c.cor)
                            return (
                                <div key={c.slug} className={`relative flex flex-col gap-4 overflow-hidden p-6 sm:p-8 ${SOMBRA_G} ${contorno(c.cor)}`} style={{ background: c.cor, color: ink }}>
                                    <p className="text-[12px] font-black uppercase tracking-[0.1em]">Sua torcida · {c.grupos[0]}</p>
                                    <p className="font-[family-name:var(--font-playfair)] text-[56px] font-extrabold leading-[0.95] sm:text-[80px]">{c.nome}</p>
                                    <div className="flex flex-wrap gap-3">
                                        <Link href={`/fandoms/${c.slug}`} className="touch-target inline-flex items-center px-5 py-3 text-[14px] font-black" style={{ background: ink, color: c.cor }}>Ver a torcida →</Link>
                                        <Link href="/quiz" className="touch-target inline-flex items-center bg-[#ffe14d] px-5 py-3 text-[14px] font-black text-[#15102b]">Fazer o quiz 🎯</Link>
                                        {c.grupoId != null && (
                                            <button type="button" onClick={() => alternar(c.grupoId!)} className="touch-target px-2 py-3 text-[13px] font-bold underline">Tirar</button>
                                        )}
                                    </div>
                                    <Novidades torcidaSlug={c.slug} ink={ink} />
                                </div>
                            )
                        })}
                    </div>
                    {!session?.user && (
                        <p className="mt-3 text-[12px] text-muted">
                            <Link href={`/entrar?callbackUrl=${encodeURIComponent('/fandoms')}`} className="font-bold underline">Entre na sua conta</Link> pra sua torcida acompanhar você em qualquer aparelho.
                        </p>
                    )}
                </section>
            )}

            {minhas.length === 0 && destaques.length > 0 && !busca && (
                <section aria-labelledby="comece-titulo" className="mb-12">
                    <h2 id="comece-titulo" className="font-[family-name:var(--font-playfair)] text-[28px] font-extrabold sm:text-[34px]">Comece por aqui 🔥</h2>
                    <div className="mt-5 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
                        {destaques.map(c => {
                            const ink = tinta(c.cor)
                            return (
                                <div key={c.slug} className={`group relative flex h-[190px] flex-col justify-between overflow-hidden p-4 transition-transform hover:-translate-y-1 sm:h-[220px] sm:p-5 ${SOMBRA_G} ${contorno(c.cor)}`} style={{ background: c.cor, color: ink }}>
                                    <span className="relative z-10 flex items-start justify-between gap-2">
                                        <span className="relative block h-14 w-14 overflow-hidden bg-[#15102b]">
                                            {c.foto && <Image src={c.foto} alt={`Foto de ${c.grupos[0]}, grupo da torcida ${c.nome}`} fill sizes="56px" className="object-cover object-top" />}
                                        </span>
                                        <BotaoSou grupoId={c.grupoId} marcada={c.grupoId != null && idsEscolhidos.includes(c.grupoId)} onAlternar={alternar} cor={c.nome} />
                                    </span>
                                    <span className="relative">
                                        <Link href={`/fandoms/${c.slug}`} className="block font-[family-name:var(--font-playfair)] text-[38px] font-extrabold leading-none after:absolute after:inset-[-200px_-40px_-40px_-40px] after:content-[''] sm:text-[46px]">{c.nome}</Link>
                                        <span className="mt-1 block text-[13px] font-bold">{c.grupos[0]}{c.ano ? ` · ${c.ano}` : ''}</span>
                                        <SeloData dias={c.diasProximaData} />
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </section>
            )}

            <section aria-labelledby="todas-titulo">
                <h2 id="todas-titulo" className="font-[family-name:var(--font-playfair)] text-[28px] font-extrabold sm:text-[34px]">{minhas.length > 0 ? 'Descubra outras torcidas' : 'Todas as torcidas'}</h2>
                <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {resto.map(c => {
                        const ink = tinta(c.cor)
                        const legenda = c.grupos.length > 2 ? `${c.grupos.length} grupos` : c.grupos.join(' · ')
                        return (
                            <div key={c.slug} className={`group relative flex min-h-[96px] items-center gap-3 p-3.5 transition-transform hover:-translate-y-0.5 ${SOMBRA} ${contorno(c.cor)}`} style={{ background: c.cor, color: ink }}>
                                <span className="relative h-[52px] w-[52px] shrink-0 overflow-hidden bg-[#15102b]">
                                    {c.foto && <Image src={c.foto} alt={`Foto de ${c.grupos[0]}, grupo da torcida ${c.nome}`} fill sizes="52px" className={`object-cover object-top ${c.encerrado ? 'grayscale' : ''}`} />}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <Link href={`/fandoms/${c.slug}`} className="block truncate text-[19px] font-black leading-tight after:absolute after:inset-0 after:content-['']">{c.nome}</Link>
                                    <span className="block truncate text-[12px] font-bold opacity-85">{legenda}{c.ano ? ` · ${c.ano}` : ''}</span>
                                    {c.encerrado && <span className="block text-[10px] font-black uppercase tracking-widest opacity-75">encerrado</span>}
                                    <SeloData dias={c.diasProximaData} />
                                </span>
                                <span className="relative z-10"><BotaoSou grupoId={c.grupoId} marcada={c.grupoId != null && idsEscolhidos.includes(c.grupoId)} onAlternar={alternar} cor={c.nome} /></span>
                            </div>
                        )
                    })}
                </div>
            </section>
        </div>
    )
}
