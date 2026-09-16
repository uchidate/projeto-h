'use client'

import { intlLocale } from '@/lib/i18n/format'
import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, Clock, ArrowRight } from 'lucide-react'
import type { WPPost } from '@/lib/wordpress/types'
import { slugsLidos } from '@/lib/leitura-local'
import { getWPImage, stripHtml, readingTime, getWPTerms } from '@/lib/utils'
import { BarraAncorada } from '@/components/ui/BarraAncorada'

interface Props {
    /**
     * Candidatos em ordem de relevância, já pontuados por `getRelatedPosts`.
     *
     * Recebe a lista e não um post só porque a escolha final depende do que
     * ESTE visitante já leu — informação que só existe no navegador.
     */
    candidatos: WPPost[]
    /** id de um elemento mais abaixo na página (ex.: author box) onde o card deve parar de seguir o scroll */
    stopAtId?: string
}

/**
 * Onde o card encosta quando vira barra.
 *
 * Era 92 fixo no codigo. O numero ficou errado quando `--site-header-h` passou a
 * ser constante em 2026-09-11: a barra de leitura ficou em 93 e o card em 92,
 * entao os dois passaram a se sobrepor em vez de empilhar.
 *
 * Agora le as alturas que o cabecalho e a barra de leitura PUBLICAM. Quando a
 * barra de leitura some, `--reading-bar-h` vai a zero e o card sobe sozinho.
 */
function topoDeEncaixe(): number {
    if (typeof window === 'undefined') return 92
    const cs = getComputedStyle(document.documentElement)
    const ler = (nome: string, padrao: number) => {
        const v = parseFloat(cs.getPropertyValue(nome))
        return Number.isFinite(v) ? v : padrao
    }
    // O offset entra aqui porque este calculo decide QUANDO fixar, comparando
    // com a posicao real na tela — e ali o deslocamento visual conta.
    return ler('--site-header-h', 64) + ler('--site-header-offset', 0) + ler('--reading-bar-h', 0)
}

/**
 * Data em formato compacto: "29 jun 2026".
 *
 * O `month: 'short'` do português não resolve sozinho — ele produz
 * "29 de jun. de 2026", 18 caracteres contra os 19 da versão por extenso, e
 * continuava sendo cortado pelo `truncate` do card. As preposições é que pesam,
 * não o nome do mês.
 *
 * `formatToParts` permite descartar o "de" e o ponto da abreviação sem montar a
 * data à mão com nomes de mês fixos no código — que quebraria em qualquer outro
 * idioma e envelheceria mal.
 *
 * Absoluta e não relativa ("há 10 dias") de propósito: data relativa depende da
 * hora em que a página é renderizada e diverge entre servidor e cliente,
 * gerando erro de hidratação numa página servida por ISR.
 */
function dataCompacta(iso: string): string {
    const partes = new Intl.DateTimeFormat(intlLocale(), {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).formatToParts(new Date(iso))
    return partes
        .filter((p) => p.type === 'day' || p.type === 'month' || p.type === 'year')
        .map((p) => (p.type === 'month' ? p.value.replace('.', '') : p.value))
        .join(' ')
}

/** Store sem mudanças: nada aqui muda durante a vida da página. */
const semAssinatura = () => () => {}

/**
 * Primeiro candidato que este visitante ainda não leu.
 *
 * Todos lidos devolve 0: sugerir algo conhecido é melhor que sumir com o bloco,
 * que tiraria a única saída no fim do artigo.
 */
function escolherNaoLido(candidatos: WPPost[]): number {
    const lidos = slugsLidos()
    const i = candidatos.findIndex((c) => !lidos.has(c.slug))
    return i > 0 ? i : 0
}

export function BlogSuggestedNext({ candidatos, stopAtId }: Props) {
    /**
     * Índice do candidato exibido.
     *
     * `useSyncExternalStore` e não `useState` + efeito: o índice depende do
     * localStorage, que não existe no servidor. O instantâneo de servidor
     * devolve 0 — a escolha por relevância —, o do cliente devolve o primeiro
     * não lido, e o React reconcilia sem quebrar a hidratação nem disparar o
     * render em cascata que um `setState` dentro de efeito causaria.
     *
     * Mesmo padrão que `lib/consent.ts` usa para o banner, pelo mesmo motivo.
     *
     * Sem assinatura: a lista de lidos não muda enquanto esta página está
     * aberta. O artigo que o visitante está lendo agora entra na lista, mas ele
     * não é candidato de si mesmo.
     */
    const indice = useSyncExternalStore(
        semAssinatura,
        () => escolherNaoLido(candidatos),
        () => 0,
    )

    const post = candidatos[indice] ?? candidatos[0]

    const [dismissed, setDismissed] = useState(false)
    const [fixed, setFixed] = useState(false)
    const [bounds, setBounds] = useState<{ left: number; width: number } | null>(null)
    const placeholderRef = useRef<HTMLDivElement>(null)
    const cardHeightRef = useRef(0)

    // Simula position:sticky via JS (position:sticky é quebrado por overflow-x:clip nos ancestors).
    // Além do gatilho, espelha left/width do placeholder pra virar uma barra encaixada na
    // coluna do artigo (estilo ge.globo), não um card flutuante centralizado na tela.
    // Sai do modo fixo assim que `stopAtId` (author box / fim do artigo) alcança a posição do card,
    // senão ele acompanharia o scroll até o rodapé do site.
    const onScroll = useCallback(() => {
        const el = placeholderRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        cardHeightRef.current = rect.height || cardHeightRef.current

        let shouldStop = false
        if (stopAtId) {
            const stopEl = document.getElementById(stopAtId)
            if (stopEl) {
                const stopRect = stopEl.getBoundingClientRect()
                shouldStop = stopRect.top <= topoDeEncaixe() + cardHeightRef.current
            }
        }

        setFixed(!shouldStop && rect.top <= topoDeEncaixe())
        setBounds({ left: rect.left, width: rect.width })
    }, [stopAtId])

    useEffect(() => {
        window.addEventListener('scroll', onScroll, { passive: true })
        window.addEventListener('resize', onScroll, { passive: true })

        const el = placeholderRef.current
        const observer = el ? new ResizeObserver(onScroll) : null
        if (el && observer) observer.observe(el)

        return () => {
            window.removeEventListener('scroll', onScroll)
            window.removeEventListener('resize', onScroll)
            observer?.disconnect()
        }
    }, [onScroll])

    const image = getWPImage(post._embedded, post.featured_image_url)
    const title = stripHtml(post.title.rendered)
    const mins = post.acf?.reading_time ?? readingTime(post.content?.rendered ?? '')
    const dataCurta = dataCompacta(post.date)
    const cats = getWPTerms(post._embedded, 'category')
    const cat = cats[0]

    if (dismissed) return null

    const card = (
        <div className="relative border border-border bg-surface hover:border-accent/60 transition-colors">
            <Link href={`/blog/${post.slug}`} className="group flex items-center gap-4 p-4 sm:p-5 pr-10">
                {image ? (
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden border border-border bg-background">
                        <Image src={image.src} alt={image.alt || title} fill sizes="48px" className="object-cover" />
                    </div>
                ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-border bg-background text-accent">
                        <ArrowRight className="h-5 w-5" />
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <p className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-accent mb-0.5">
                        Sugerido para você{cat ? ` · ${cat.name}` : ''}
                    </p>
                    {/* Duas linhas no celular, uma a partir de sm.
                      * Com 390px, miniatura de 48px e a seta, sobram ~250px: um
                      * clamp de uma linha corta o titulo no meio e o card deixa
                      * de dizer o que oferece. */}
                    <p className="line-clamp-2 sm:line-clamp-1 text-[15px] font-black leading-snug tracking-[-0.02em] text-foreground group-hover:text-accent transition-colors">
                        {title}
                    </p>
                    {/* whitespace-nowrap de proposito: sem ele a data longa
                      * quebrava a linha e o icone do relogio ficava sozinho na
                      * linha de cima, desalinhado — visivel no print de
                      * 2026-09-11. Data curta resolve a causa; o nowrap impede
                      * que volte com um titulo de categoria maior. */}
                    <p className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap text-[12px] text-muted">
                        <Clock size={10} className="shrink-0" />
                        <span className="truncate">{mins} min · {dataCurta}</span>
                    </p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
            </Link>
            <button
                type="button"
                onClick={() => setDismissed(true)}
                aria-label="Fechar sugestão"
                className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center text-muted hover:text-foreground hover:bg-background transition-colors after:absolute after:-inset-2.5 after:content-['']"
            >
                <X size={12} />
            </button>
        </div>
    )

    return (
        <>
            {/* Placeholder inline — mantém o espaço no fluxo sempre */}
            <div ref={placeholderRef} className={fixed ? 'invisible' : ''}>
                {card}
            </div>

            {/* Versão fixada no topo, encaixada na mesma coluna do artigo (estilo ge.globo) */}
            {fixed && bounds && (
                <BarraAncorada
                    posicao="fixed"
                    abaixoDaBarraDeLeitura
                    z={300}
                    style={{ left: bounds.left, width: bounds.width }}
                >
                    {card}
                </BarraAncorada>
            )}
        </>
    )
}
