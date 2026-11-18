/**
 * Modo de simulação de anúncios: `?hh-simular-anuncios=1`.
 *
 * Para avaliar ONDE os anúncios caem (posição, densidade, primeira tela,
 * sobreposição com banner e loja, CLS) sem anúncio real. O AdSense não tem modo
 * de teste para anúncios automáticos, e anúncio real aberto por robô ou por quem
 * só está testando é impressão inválida (risco para a conta). Então, neste modo:
 *
 *  - o script do Google NUNCA é carregado (AdSenseLoader instala esta simulação no lugar);
 *  - cada espaço de anúncio do site recebe um bloco cinza do tamanho típico que o
 *    Google serve naquele formato, com atraso de leilão (0,8 a 2 s);
 *  - âncora e vinheta do Google (anúncios automáticos) são simuladas com a mesma
 *    marcação que o Google usa, para que as regras de CSS do site valham igual
 *    (ex.: escondidas enquanto o banner de consentimento está aberto);
 *  - o aparelho sai da medição (Umami, Clarity), como no `?hh-teste=1`;
 *  - a trava de robô dos anúncios não se aplica: o simulador do placar navega com Playwright.
 *
 * Vale só na aba (sessionStorage). `?hh-simular-anuncios=0` desliga.
 * Opções na mesma URL: `ancora=0`, `vinheta=0`, `preenche=0.65` (fração dos espaços que recebem anúncio).
 */

export const CHAVE_SIMULACAO = 'hh-simular-anuncios'

export type OpcoesSimulacao = { ancora: boolean; vinheta: boolean; preenche: number }

type Armazenamento = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export function lerSimulacao(busca: string, armazenamento: Armazenamento | null): OpcoesSimulacao | null {
    const p = new URLSearchParams(busca)
    const pedido = p.get('hh-simular-anuncios')
    const daUrl = (): OpcoesSimulacao => {
        const preenche = Number(p.get('preenche') ?? '1')
        return {
            ancora: p.get('ancora') !== '0',
            vinheta: p.get('vinheta') !== '0',
            preenche: Number.isFinite(preenche) ? Math.min(1, Math.max(0, preenche)) : 1,
        }
    }
    try {
        if (pedido === '0') { armazenamento?.removeItem(CHAVE_SIMULACAO); return null }
        if (pedido === '1') {
            const o = daUrl()
            armazenamento?.setItem(CHAVE_SIMULACAO, JSON.stringify(o))
            return o
        }
        const salvo = armazenamento?.getItem(CHAVE_SIMULACAO)
        return salvo ? (JSON.parse(salvo) as OpcoesSimulacao) : null
    } catch {
        return pedido === '1' ? daUrl() : null
    }
}

function sessao(): Armazenamento | null {
    try { return window.sessionStorage } catch { return null }
}

/** No navegador: a aba está em modo de simulação? (lê e grava o pedido da URL). */
export function simulacaoAtiva(): OpcoesSimulacao | null {
    if (typeof window === 'undefined') return null
    return lerSimulacao(window.location.search, sessao())
}

/**
 * Tamanho típico que o Google serve por formato. Referência: tamanhos padrão do
 * AdSense (300×250, 336×280, 320×100, 728×90, 300×600) e o responsivo de largura
 * total no celular (~280 px de altura). Aproximação: o leilão real varia.
 */
export function tamanhoSimulado(formato: string, larguraTela: number, larguraEspaco: number): { w: number; h: number } {
    const celular = larguraTela < 768
    const caber = (w: number) => Math.max(1, Math.min(w, larguraEspaco || w))
    switch (formato) {
        case 'horizontal': return celular ? { w: caber(320), h: 100 } : { w: caber(728), h: 90 }
        case 'rectangle': return larguraEspaco >= 336 && !celular ? { w: 336, h: 280 } : { w: caber(300), h: 250 }
        case 'vertical': return celular ? { w: caber(300), h: 250 } : { w: caber(300), h: 600 }
        default: return celular ? { w: caber(larguraTela), h: 280 } : larguraEspaco >= 336 ? { w: caber(336), h: 280 } : { w: caber(300), h: 250 }
    }
}

const ESTILO_BLOCO = 'display:flex;align-items:center;justify-content:center;margin:0 auto;box-sizing:border-box;'
    + 'background:repeating-linear-gradient(45deg,#d9d9d9 0 10px,#c8c8c8 10px 20px);border:2px dashed #888;'
    + 'color:#333;font:600 12px/1.2 system-ui,sans-serif;text-align:center'

function bloco(doc: Document, w: number | string, h: number, rotulo: string) {
    const d = doc.createElement('div')
    d.setAttribute('data-sim-anuncio', rotulo)
    d.style.cssText = `${ESTILO_BLOCO};width:${typeof w === 'number' ? `${w}px` : w};height:${h}px`
    d.textContent = `ANÚNCIO SIMULADO · ${rotulo}`
    return d
}

/** Preenche um espaço `ins.adsbygoogle` como o AdSense faria, com o tamanho simulado. */
export function preencher(ins: HTMLElement, win: Window, cheio: boolean) {
    ins.setAttribute('data-adsbygoogle-status', 'done')
    if (!cheio) { ins.setAttribute('data-ad-status', 'unfilled'); return }
    const formato = ins.getAttribute('data-ad-format') ?? 'auto'
    const { w, h } = tamanhoSimulado(formato, win.innerWidth, ins.getBoundingClientRect().width || ins.parentElement?.getBoundingClientRect().width || win.innerWidth)
    ins.replaceChildren(bloco(win.document, w, h, `${formato} ${w}×${h}`))
    ins.style.height = `${h}px`
    ins.setAttribute('data-ad-status', 'filled')
}

/** Instala a simulação no lugar do script do Google. Devolve a função que desfaz. */
export function instalarSimulacao(opcoes: OpcoesSimulacao, win: Window = window): () => void {
    const doc = win.document
    const timers: number[] = []
    const fila: unknown[] = []
    // O site chama adsbygoogle.push({}) por espaço (via adQueue); o Google preenche o próximo <ins> livre.
    const atender = () => {
        const ins = [...doc.querySelectorAll<HTMLElement>('ins.adsbygoogle:not([data-adsbygoogle-status])')]
            .find(i => !i.hasAttribute('data-anchor-status'))
        if (!ins) return
        ins.setAttribute('data-adsbygoogle-status', 'pending')
        timers.push(win.setTimeout(() => preencher(ins, win, Math.random() < opcoes.preenche), 800 + Math.random() * 1200))
    }
    const falso = Object.assign(fila, {
        push: (...itens: unknown[]) => { itens.forEach(atender); return Array.prototype.push.apply(fila, itens) },
    })
    // Pedidos feitos antes da instalação ficaram num array comum, como no snippet oficial:
    // o script real os atende ao carregar, e a simulação também.
    const anteriores = (win as unknown as { adsbygoogle?: unknown[] }).adsbygoogle
    ;(win as unknown as { adsbygoogle: unknown }).adsbygoogle = falso
    if (Array.isArray(anteriores)) falso.push(...anteriores)

    let ancora: HTMLElement | null = null
    if (opcoes.ancora) {
        timers.push(win.setTimeout(() => {
            const celular = win.innerWidth < 768
            const h = celular ? 100 : 90
            ancora = doc.createElement('ins')
            ancora.className = 'adsbygoogle'
            ancora.setAttribute('data-anchor-status', 'displayed')
            ancora.setAttribute('data-anchor-shown', 'true')
            ancora.style.cssText = `position:fixed;left:0;right:0;bottom:0;z-index:2147483646;height:${h}px;display:flex;justify-content:center;background:#fff;box-shadow:0 -2px 6px rgba(0,0,0,.25)`
            ancora.appendChild(bloco(doc, celular ? '100%' : 728, h, 'âncora do Google'))
            doc.body.appendChild(ancora)
        }, 2500))
    }

    // Vinheta: o Google a mostra ao seguir um link interno, entre uma página e outra
    // (frequência real não é pública; aqui: a partir da 2ª página, no máximo 1 a cada 3 navegações).
    // Contagem na aba (sessionStorage): link no texto do WordPress recarrega a página inteira.
    const CHAVE_NAV = `${CHAVE_SIMULACAO}-nav`
    const lerNav = (): { n: number; ultima: number } => { try { return JSON.parse(win.sessionStorage.getItem(CHAVE_NAV) ?? '') } catch { return { n: 0, ultima: -10 } } }
    const gravarNav = (v: { n: number; ultima: number }) => { try { win.sessionStorage.setItem(CHAVE_NAV, JSON.stringify(v)) } catch { /* sem storage: conta só nesta página */ } }
    const aoClicar = (e: MouseEvent) => {
        if (!opcoes.vinheta || e.defaultPrevented || e.button !== 0) return
        const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
        if (!a || a.target === '_blank' || a.dataset.simLiberado) return
        let destino: URL
        try { destino = new URL(a.href, win.location.href) } catch { return }
        if (destino.origin !== win.location.origin || destino.pathname === win.location.pathname) return
        const nav = lerNav()
        nav.n++
        const mostrar = nav.n >= 2 && nav.n - nav.ultima >= 3
        if (mostrar) nav.ultima = nav.n
        gravarNav(nav)
        if (!mostrar) return
        e.preventDefault()
        e.stopImmediatePropagation()
        const vinheta = doc.createElement('ins')
        vinheta.className = 'adsbygoogle'
        vinheta.setAttribute('data-vignette-loaded', 'true')
        vinheta.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center'
        const caixa = bloco(doc, Math.min(win.innerWidth - 32, 336), Math.min(win.innerHeight - 160, 480), 'vinheta do Google')
        const fechar = doc.createElement('button')
        fechar.type = 'button'
        fechar.textContent = 'Fechar anúncio'
        fechar.setAttribute('data-sim-fechar-vinheta', '')
        fechar.style.cssText = 'position:absolute;top:16px;right:16px;padding:8px 12px;font:600 14px system-ui;background:#fff;border:1px solid #333'
        fechar.onclick = () => {
            vinheta.remove()
            if (win.location.hash.includes('google_vignette')) history.replaceState(null, '', win.location.pathname + win.location.search)
            a.dataset.simLiberado = '1'
            a.click()
            delete a.dataset.simLiberado
        }
        vinheta.append(caixa, fechar)
        doc.body.appendChild(vinheta)
        win.location.hash = 'google_vignette'
    }
    doc.addEventListener('click', aoClicar, true)

    return () => {
        timers.forEach(t => win.clearTimeout(t))
        doc.removeEventListener('click', aoClicar, true)
        ancora?.remove()
    }
}
