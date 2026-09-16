/**
 * Serializa os `adsbygoogle.push()` da página.
 *
 * Lições medidas ao vivo (2026-07-12):
 * 1. Vários slots entram na margem do IntersectionObserver na MESMA rolagem
 *    e disparavam push() no mesmo frame — o AdSense processa todos juntos e
 *    o main thread trava por instantes (jank de mobile). Pushes agora saem
 *    um a um, em idle time, com espaçamento mínimo.
 * A proteção do LCP pertence ao placement: slots below-fold usam
 * IntersectionObserver e os above-fold são explicitamente `eager`. Segurar
 * também a fila global até `window.load` atrasava até slots já visíveis e
 * eliminava oportunidades em visitas curtas. O array `adsbygoogle` aceita o
 * push antes de o script terminar de baixar, como no snippet oficial; esta
 * fila cuida apenas de serialização, visibilidade da aba e conectividade.
 */
const queue: Array<() => void> = []
let draining = false

const SPACING_MS = 350
function canRunAuction() {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return false
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return false
    return true
}

if (typeof window !== 'undefined') {
    // Safari suspende timers/rede de abas em segundo plano e restaura páginas
    // pelo back/forward cache. O leilão só retoma quando volta a ter chance
    // real de viewability e conexão.
    document.addEventListener('visibilitychange', () => maybeDrain())
    window.addEventListener('online', () => maybeDrain())
    window.addEventListener('pageshow', () => maybeDrain())
}

function scheduleIdle(fn: () => void) {
    if (typeof requestIdleCallback === 'function') requestIdleCallback(() => fn(), { timeout: 1000 })
    else setTimeout(fn, 50)
}

function drainNext() {
    if (!canRunAuction()) {
        draining = false
        return
    }
    const job = queue.shift()
    if (!job) { draining = false; return }
    try { job() } catch { /* AdSense ausente (dev/adblock) — nunca quebra a fila */ }
    setTimeout(() => scheduleIdle(drainNext), SPACING_MS)
}

function maybeDrain() {
    if (draining || !canRunAuction() || queue.length === 0) return
    draining = true
    drainNext()
}

export function enqueueAdPush(push: () => void) {
    queue.push(push)
    maybeDrain()
}

export type EstadoDoSlot = 'pronto' | 'fora_da_pagina' | 'ja_preenchido' | 'sem_largura'

/**
 * Checa o `<ins>` NA HORA do push, não quando ele entrou na fila.
 *
 * `adsbygoogle.push({})` preenche o próximo `<ins>` livre do DOM. Entre entrar
 * na fila e rodar (idle + 350ms por slot), o slot pode ter sido desmontado numa
 * troca de rota, ocultado por media query ou já preenchido. O AdSense então
 * lança "No slot size for availableWidth=0" ou "All 'ins' elements ... already
 * have ads" — 487 eventos em 14 dias no Sentry (PHP-G, PHP-F) até 2026-09-11,
 * quando o filtro `adsbygoogle` do cliente passou a esconder, sem corrigir, o
 * leilão perdido.
 */
export function estadoDoSlot(ins: Element | null | undefined): EstadoDoSlot {
    if (!ins || !ins.isConnected) return 'fora_da_pagina'
    if (ins.getAttribute('data-adsbygoogle-status')) return 'ja_preenchido'
    if ((ins as HTMLElement).offsetWidth <= 0) return 'sem_largura'
    return 'pronto'
}

/**
 * Enfileira o push de UM slot. Sem largura, espera o slot ganhar largura
 * (ResizeObserver) e enfileira de novo; fora da página ou já preenchido, desiste.
 * Devolve uma função que cancela a espera.
 */
export function enqueueSlotPush(obterIns: () => Element | null | undefined, push: () => void): () => void {
    let observador: ResizeObserver | null = null
    let cancelado = false
    const tentar = () => {
        if (cancelado) return
        const ins = obterIns()
        const estado = estadoDoSlot(ins)
        if (estado === 'pronto') {
            push()
            return
        }
        if (estado === 'sem_largura' && ins && typeof ResizeObserver !== 'undefined' && !observador) {
            observador = new ResizeObserver(() => {
                if (estadoDoSlot(obterIns()) === 'sem_largura') return
                observador?.disconnect()
                observador = null
                enqueueAdPush(tentar)
            })
            observador.observe(ins)
        }
    }
    enqueueAdPush(tentar)
    return () => {
        cancelado = true
        observador?.disconnect()
    }
}

/** Só para testes: zera fila e estado de drenagem entre casos. */
export function resetAdQueueForTests() {
    queue.length = 0
    draining = false
}
