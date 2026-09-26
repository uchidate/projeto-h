'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useSyncExternalStore } from 'react'
import { interpretarContexto, lerContextoCru, vizinhos, type ItemLista, type Vizinhanca } from '@/lib/artists/listaContexto'

const SERIF = 'font-[family-name:var(--font-playfair)]'
const KICKER = 'font-mono text-[10px] font-black uppercase tracking-[0.14em] sm:text-[11px]'
const nenhum = () => () => { /* o contexto só muda na lista, em outra página */ }

/** Vizinhos do artista na lista de onde a pessoa veio; nulo para quem chegou direto na ficha. */
function useVizinhanca(slug: string): Vizinhanca | null {
    const cru = useSyncExternalStore(nenhum, lerContextoCru, () => '')
    return useMemo(() => vizinhos(interpretarContexto(cru), slug), [cru, slug])
}

const numero = (n: number) => n.toLocaleString('pt-BR')

function Foto({ item, tamanho }: { item: ItemLista; tamanho: number }) {
    return item.foto
        ? <Image src={item.foto} alt="" width={tamanho} height={tamanho} className="rounded-full object-cover object-top" style={{ width: tamanho, height: tamanho }} />
        : <span aria-hidden className="rounded-full bg-background" style={{ width: tamanho, height: tamanho }} />
}

/** Faixa logo abaixo do cabeçalho: volta à lista e vai ao artista anterior ou seguinte. */
export function ListaBarra({ slug }: { slug: string }) {
    const v = useVizinhanca(slug)
    if (!v) return null
    return (
        <nav aria-label="Navegação na lista de artistas" data-bloco="ficha-lista-barra" className="border-b border-border bg-surface/60">
            <div className="page-wrap flex h-[52px] items-center justify-between gap-3 lg:h-[60px]">
                <Link href={v.href} className="touch-target flex min-w-0 items-center gap-2 text-[14px] font-semibold text-foreground">
                    <span aria-hidden className="text-muted">‹</span>
                    <span className="lg:hidden">Lista</span><span className="hidden lg:inline">Voltar à lista</span>
                    <span className="truncate text-[13px] font-normal text-muted lg:text-[14px]">
                        <span className="hidden lg:inline">· {v.rotulo} </span>· {numero(v.posicao)} de {numero(v.total)}
                    </span>
                </Link>
                <div className="flex shrink-0 gap-1.5 lg:gap-2.5">
                    {v.anterior ? (
                        <Link href={`/artists/${v.anterior.slug}`} aria-label={`Artista anterior: ${v.anterior.nome}`} data-posicao="anterior"
                            className="touch-target flex h-11 w-11 items-center justify-center border border-border-strong text-[18px] text-foreground hover:border-accent/60 lg:w-auto lg:gap-3 lg:pl-1.5 lg:pr-4 lg:text-[14px] lg:font-semibold">
                            <span className="hidden lg:block"><Foto item={v.anterior} tamanho={32} /></span>
                            <span aria-hidden className="lg:text-muted">‹</span>
                            <span className="hidden lg:inline">{v.anterior.nome}</span>
                        </Link>
                    ) : null}
                    {v.proximo ? (
                        <Link href={`/artists/${v.proximo.slug}`} aria-label={`Próximo artista: ${v.proximo.nome}`} data-posicao="proximo"
                            className="touch-target flex h-11 w-11 items-center justify-center bg-accent text-[18px] font-extrabold text-[#0d0b0f] hover:opacity-90 lg:w-auto lg:gap-3 lg:pl-4 lg:pr-1.5 lg:text-[14px]">
                            <span className="hidden lg:inline">{v.proximo.nome}</span>
                            <span aria-hidden className="lg:font-normal">›</span>
                            <span className="hidden lg:block"><Foto item={v.proximo} tamanho={32} /></span>
                        </Link>
                    ) : null}
                </div>
            </div>
        </nav>
    )
}

/** Fim da ficha: os dois vizinhos em cartões grandes, para seguir sem voltar à lista. */
export function ListaProxima({ slug }: { slug: string }) {
    const v = useVizinhanca(slug)
    if (!v || (!v.anterior && !v.proximo)) return null
    return (
        <section aria-labelledby="lista-proxima-titulo" data-bloco="ficha-lista-proxima" className="page-wrap pb-10 pt-10 sm:pt-12">
            <div className="flex items-baseline justify-between gap-4">
                <h2 id="lista-proxima-titulo" className={`${SERIF} text-[26px] font-semibold leading-tight sm:text-[34px]`}>Continue pela lista</h2>
                <Link href={v.href} className="hidden text-[14px] font-semibold text-muted hover:text-foreground sm:inline">Voltar à lista · {v.rotulo} ›</Link>
            </div>
            <div className="mt-5 grid gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4">
                {v.anterior && (
                    <Link href={`/artists/${v.anterior.slug}`} data-posicao="anterior"
                        className="order-2 flex items-center gap-4 border border-border bg-surface p-3 hover:border-accent/60 sm:order-1 sm:gap-6 sm:p-4">
                        <span className="relative h-24 w-[72px] shrink-0 overflow-hidden bg-background sm:h-32 sm:w-24">
                            {v.anterior.foto && <Image src={v.anterior.foto} alt="" fill sizes="96px" className="object-cover object-top" />}
                        </span>
                        <span className="min-w-0">
                            <span className={`${KICKER} block text-muted`}>‹ Anterior · {numero(v.posicao - 1)}</span>
                            <span className={`mt-1.5 block ${SERIF} text-[24px] font-semibold leading-tight sm:mt-2 sm:text-[30px]`}>{v.anterior.nome}</span>
                            {v.anterior.papel && <span className="mt-1 block text-[12px] text-muted sm:mt-1.5 sm:text-[13px]">{v.anterior.papel}</span>}
                        </span>
                    </Link>
                )}
                {v.proximo && (
                    <Link href={`/artists/${v.proximo.slug}`} data-posicao="proximo"
                        className="order-1 flex items-center justify-between gap-4 border border-accent bg-surface p-3 hover:bg-accent/5 sm:order-2 sm:gap-6 sm:p-4">
                        <span className="min-w-0">
                            <span className={`${KICKER} block text-accent`}>Próximo · {numero(v.posicao + 1)} ›</span>
                            <span className={`mt-1.5 block ${SERIF} text-[24px] font-semibold leading-tight sm:mt-2 sm:text-[30px]`}>{v.proximo.nome}</span>
                            {v.proximo.papel && <span className="mt-1 block text-[12px] text-muted sm:mt-1.5 sm:text-[13px]">{v.proximo.papel}</span>}
                        </span>
                        <span className="relative h-24 w-[72px] shrink-0 overflow-hidden bg-background sm:h-32 sm:w-24">
                            {v.proximo.foto && <Image src={v.proximo.foto} alt="" fill sizes="96px" className="object-cover object-top" />}
                        </span>
                    </Link>
                )}
            </div>
            <Link href={v.href} className="touch-target mt-3.5 flex h-12 items-center justify-center border border-border-strong text-[14px] font-semibold sm:hidden">Voltar à lista · {v.rotulo}</Link>
        </section>
    )
}
