'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useSyncExternalStore } from 'react'
import { podeGuardarHistorico } from '@/lib/consent'

export interface CartaoTorcida {
    slug: string
    nome: string
    cor: string
    /** Nomes dos grupos da torcida (o primeiro é o principal). */
    grupos: string[]
    grupoSlug: string | null
    foto: string | null
    ano: number | null
    encerrado: boolean
}

const CHAVE = 'hh:torcidas:v1'
const EVENTO = 'hh:torcidas'
const SOMBRA = 'shadow-[5px_5px_0_#15102b] dark:shadow-[5px_5px_0_#000]'
const SOMBRA_G = 'shadow-[7px_7px_0_#15102b] dark:shadow-[7px_7px_0_#000]'
// Torcidas para quem ainda não escolheu nenhuma: as mais conhecidas, se existirem na lista.
const DESTAQUES = ['ARMY', 'BLINK', 'ONCE', 'STAY']

function lerCru(): string { try { return window.localStorage.getItem(CHAVE) ?? '' } catch { return '' } }
function assinar(aoMudar: () => void) {
    window.addEventListener('storage', aoMudar); window.addEventListener(EVENTO, aoMudar)
    return () => { window.removeEventListener('storage', aoMudar); window.removeEventListener(EVENTO, aoMudar) }
}
function interpretar(cru: string): string[] {
    try { const l = cru ? JSON.parse(cru) : []; return Array.isArray(l) ? l.filter((s): s is string => typeof s === 'string').slice(0, 5) : [] } catch { return [] }
}
function alternar(slug: string, atuais: string[]) {
    if (!podeGuardarHistorico()) return
    const novo = atuais.includes(slug) ? atuais.filter(s => s !== slug) : [slug, ...atuais].slice(0, 5)
    try { window.localStorage.setItem(CHAVE, JSON.stringify(novo)); window.dispatchEvent(new Event(EVENTO)) } catch { /* sem armazenamento: a escolha não fica salva */ }
}

/** Tinta legível sobre a cor da torcida (escura sobre cor clara, branca sobre cor escura). */
function tinta(cor: string): string {
    const m = /^#?([0-9a-f]{6})$/i.exec(cor.trim())
    if (!m) return '#15102b'
    const n = parseInt(m[1], 16)
    const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
    return lum > 0.55 ? '#15102b' : '#ffffff'
}

function BotaoSou({ slug, marcada, atuais, cor }: { slug: string; marcada: boolean; atuais: string[]; cor: string }) {
    return (
        <button type="button" aria-pressed={marcada} onClick={e => { e.preventDefault(); e.stopPropagation(); alternar(slug, atuais) }}
            className="touch-target px-2.5 py-1.5 text-[11px] font-black"
            style={{ background: marcada ? '#15102b' : 'rgba(255,255,255,0.75)', color: marcada ? '#fff' : '#15102b' }}
            title={marcada ? 'Tirar das minhas torcidas' : 'Sou dessa torcida'}>
            {marcada ? '✓ Sou dessa' : '＋ Sou dessa'}
            <span className="sr-only"> {cor}</span>
        </button>
    )
}

/** Espaço do fã: escolher a(s) torcida(s), um painel só delas e o catálogo completo em cartões coloridos. */
export function EspacoDoFa({ cartoes, busca }: { cartoes: CartaoTorcida[]; busca?: string }) {
    const cru = useSyncExternalStore(assinar, lerCru, () => '')
    const escolhidas = useMemo(() => interpretar(cru), [cru])
    const porSlug = useMemo(() => new Map(cartoes.map(c => [c.slug, c])), [cartoes])
    const minhas = escolhidas.map(s => porSlug.get(s)).filter((c): c is CartaoTorcida => !!c)
    const destaques = useMemo(() => DESTAQUES.map(n => cartoes.find(c => c.nome.toUpperCase() === n)).filter((c): c is CartaoTorcida => !!c), [cartoes])
    const resto = cartoes.filter(c => !escolhidas.includes(c.slug))

    return (
        <div>
            {minhas.length > 0 && (
                <section aria-labelledby="minhas-titulo" className="mb-12">
                    <h2 id="minhas-titulo" className="font-[family-name:var(--font-playfair)] text-[28px] font-extrabold sm:text-[34px]">Sua torcida 💜</h2>
                    <div className="mt-5 grid gap-5 md:grid-cols-2">
                        {minhas.map(c => {
                            const ink = tinta(c.cor)
                            return (
                                <div key={c.slug} className={`relative flex flex-col gap-4 overflow-hidden p-6 sm:p-8 ${SOMBRA_G}`} style={{ background: c.cor, color: ink }}>
                                    <p className="text-[12px] font-black uppercase tracking-[0.1em]">Sua torcida · {c.grupos[0]}</p>
                                    <p className="font-[family-name:var(--font-playfair)] text-[56px] font-extrabold leading-[0.95] sm:text-[80px]">{c.nome}</p>
                                    <div className="flex flex-wrap gap-3">
                                        <Link href={`/fandoms/${c.slug}`} className="touch-target inline-flex items-center px-5 py-3 text-[14px] font-black" style={{ background: ink, color: c.cor }}>Ver a torcida →</Link>
                                        <Link href="/quiz" className="touch-target inline-flex items-center bg-[#ffe14d] px-5 py-3 text-[14px] font-black text-[#15102b]">Fazer o quiz 🎯</Link>
                                        <button type="button" onClick={() => alternar(c.slug, escolhidas)} className="touch-target px-2 py-3 text-[13px] font-bold underline">Tirar</button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>
            )}

            {minhas.length === 0 && destaques.length > 0 && !busca && (
                <section aria-labelledby="comece-titulo" className="mb-12">
                    <h2 id="comece-titulo" className="font-[family-name:var(--font-playfair)] text-[28px] font-extrabold sm:text-[34px]">Comece por aqui 🔥</h2>
                    <div className="mt-5 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
                        {destaques.map(c => {
                            const ink = tinta(c.cor)
                            return (
                                <Link key={c.slug} href={`/fandoms/${c.slug}`} className={`relative flex h-[190px] flex-col justify-between overflow-hidden p-4 transition-transform hover:-translate-y-1 sm:h-[220px] sm:p-5 ${SOMBRA_G}`} style={{ background: c.cor, color: ink }}>
                                    <span className="relative"><BotaoSou slug={c.slug} marcada={false} atuais={escolhidas} cor={c.nome} /></span>
                                    <span className="relative">
                                        <span className="block font-[family-name:var(--font-playfair)] text-[38px] font-extrabold leading-none sm:text-[46px]">{c.nome}</span>
                                        <span className="mt-1 block text-[13px] font-bold">{c.grupos[0]}{c.ano ? ` · ${c.ano}` : ''}</span>
                                    </span>
                                </Link>
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
                            <Link key={c.slug} href={`/fandoms/${c.slug}`} className={`group relative flex min-h-[96px] items-center gap-3 p-3.5 transition-transform hover:-translate-y-0.5 ${SOMBRA}`} style={{ background: c.cor, color: ink }}>
                                <span className="relative h-[52px] w-[52px] shrink-0 overflow-hidden bg-[#15102b]">
                                    {c.foto && <Image src={c.foto} alt="" fill sizes="52px" className={`object-cover object-top ${c.encerrado ? 'grayscale' : ''}`} />}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[19px] font-black leading-tight">{c.nome}</span>
                                    <span className="block truncate text-[12px] font-bold opacity-85">{legenda}{c.ano ? ` · ${c.ano}` : ''}</span>
                                    {c.encerrado && <span className="block text-[10px] font-black uppercase tracking-widest opacity-75">encerrado</span>}
                                </span>
                                <BotaoSou slug={c.slug} marcada={false} atuais={escolhidas} cor={c.nome} />
                            </Link>
                        )
                    })}
                </div>
            </section>
        </div>
    )
}
