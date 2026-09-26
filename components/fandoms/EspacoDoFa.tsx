'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { podeGuardarHistorico } from '@/lib/consent'
import { contorno, tinta } from '@/lib/fandoms/cor'
import { AvisoConsentimento } from '@/components/consent/AvisoConsentimento'

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
/** Lista nova depois de marcar ou desmarcar (no máximo 5). */
function proxima(slug: string, atuais: string[]): string[] {
    return atuais.includes(slug) ? atuais.filter(s => s !== slug) : [slug, ...atuais].slice(0, 5)
}

/** Guarda no navegador se houver permissão. Devolve false quando não guardou (sem permissão ou sem armazenamento). */
function guardar(lista: string[]): boolean {
    if (!podeGuardarHistorico()) return false
    try { window.localStorage.setItem(CHAVE, JSON.stringify(lista)); window.dispatchEvent(new Event(EVENTO)); return true } catch { return false }
}

function BotaoSou({ slug, marcada, onAlternar, cor }: { slug: string; marcada: boolean; onAlternar: (slug: string) => void; cor: string }) {
    return (
        <button type="button" aria-pressed={marcada} onClick={e => { e.preventDefault(); e.stopPropagation(); onAlternar(slug) }}
            className="touch-target px-2.5 py-1.5 text-[11px] font-black"
            style={{ background: marcada ? '#15102b' : 'rgba(255,255,255,0.75)', color: marcada ? '#fff' : '#15102b' }}
            title={marcada ? 'Tirar das minhas torcidas' : 'Sou dessa torcida'}>
            {marcada ? '✓ Sou dessa' : '＋ Sou dessa'}
            <span className="sr-only"> {cor}</span>
        </button>
    )
}

/** Botão "Sou dessa torcida" da página de cada fandom: marca ou desmarca e reflete o estado guardado. */
export function BotaoTorcida({ slug, ink, cor }: { slug: string; ink: string; cor: string }) {
    const cru = useSyncExternalStore(assinar, lerCru, () => '')
    const guardadas = useMemo(() => interpretar(cru), [cru])
    // Sem permissão para guardar, a marcação vale só nesta visita.
    const [naSessao, setNaSessao] = useState<string[] | null>(null)
    const atuais = naSessao ?? guardadas
    const marcada = atuais.includes(slug)
    const alternar = () => { const novo = proxima(slug, atuais); if (!guardar(novo)) setNaSessao(novo) }
    return (
        <>
        <button type="button" aria-pressed={marcada} onClick={alternar}
            className="touch-target inline-flex items-center px-5 py-3 text-[14px] font-black"
            style={marcada ? { background: '#ffe14d', color: '#15102b' } : { background: ink, color: cor }}>
            {marcada ? '✓ Sua torcida' : '＋ Sou dessa torcida'}
        </button>
        {marcada && <AvisoConsentimento recurso="sua torcida" className="w-full max-w-md" />}
        </>
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
    const cru = useSyncExternalStore(assinar, lerCru, () => '')
    const guardadas = useMemo(() => interpretar(cru), [cru])
    // Sem permissão para guardar, a escolha vale só nesta visita (fica em memória) e o aviso explica o porquê.
    const [naSessao, setNaSessao] = useState<string[] | null>(null)
    const escolhidas = naSessao ?? guardadas
    const alternar = (slug: string) => { const novo = proxima(slug, escolhidas); if (!guardar(novo)) setNaSessao(novo) }
    const porSlug = useMemo(() => new Map(cartoes.map(c => [c.slug, c])), [cartoes])
    const minhas = escolhidas.map(s => porSlug.get(s)).filter((c): c is CartaoTorcida => !!c)
    const destaques = useMemo(() => DESTAQUES.map(n => cartoes.find(c => c.nome.toUpperCase() === n)).filter((c): c is CartaoTorcida => !!c), [cartoes])
    const resto = cartoes.filter(c => !escolhidas.includes(c.slug))

    return (
        <div>
            {minhas.length > 0 && (
                <section aria-labelledby="minhas-titulo" className="mb-12">
                    <h2 id="minhas-titulo" className="font-[family-name:var(--font-playfair)] text-[28px] font-extrabold sm:text-[34px]">Sua torcida 💜</h2>
                    <AvisoConsentimento recurso="suas torcidas" className="mt-3 max-w-2xl" />
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
                                        <button type="button" onClick={() => alternar(c.slug)} className="touch-target px-2 py-3 text-[13px] font-bold underline">Tirar</button>
                                    </div>
                                    <Novidades torcidaSlug={c.slug} ink={ink} />
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
                                <div key={c.slug} className={`group relative flex h-[190px] flex-col justify-between overflow-hidden p-4 transition-transform hover:-translate-y-1 sm:h-[220px] sm:p-5 ${SOMBRA_G} ${contorno(c.cor)}`} style={{ background: c.cor, color: ink }}>
                                    <span className="relative z-10 flex items-start justify-between gap-2">
                                        <span className="relative block h-14 w-14 overflow-hidden bg-[#15102b]">
                                            {c.foto && <Image src={c.foto} alt={`Foto de ${c.grupos[0]}, grupo da torcida ${c.nome}`} fill sizes="56px" className="object-cover object-top" />}
                                        </span>
                                        <BotaoSou slug={c.slug} marcada={false} onAlternar={alternar} cor={c.nome} />
                                    </span>
                                    <span className="relative">
                                        <Link href={`/fandoms/${c.slug}`} className="block font-[family-name:var(--font-playfair)] text-[38px] font-extrabold leading-none after:absolute after:inset-[-200px_-40px_-40px_-40px] after:content-[''] sm:text-[46px]">{c.nome}</Link>
                                        <span className="mt-1 block text-[13px] font-bold">{c.grupos[0]}{c.ano ? ` · ${c.ano}` : ''}</span>
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
                                </span>
                                <span className="relative z-10"><BotaoSou slug={c.slug} marcada={false} onAlternar={alternar} cor={c.nome} /></span>
                            </div>
                        )
                    })}
                </div>
            </section>
        </div>
    )
}
