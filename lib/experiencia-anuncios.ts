/**
 * Quanto anúncio, loja e banner de consentimento pesam em cada página, medido no
 * aparelho de quem lê. Funções puras (recebem o documento) para o teste; quem
 * observa a página e envia é components/analytics/RastreioDeAnuncios.tsx.
 *
 * Por que existe (2026-11-18): o painel mostrava CLS piorando (94% → 86% bom no
 * Brasil) e leitura caindo, e não havia como saber se a culpa era do anúncio, da
 * vitrine ou de outra coisa. Os eventos `ad_slot_*` só cobrem os blocos que o site
 * insere, em 10% das sessões; âncora e vinheta do Google (anúncios automáticos,
 * ligados no painel do AdSense) não eram medidas.
 */

export type Categoria = 'anuncio' | 'loja' | 'outro'

/** Tudo que é anúncio: bloco do site, âncora própria e o que o Google injeta sozinho. */
const SELETOR_ANUNCIO = '[data-ad-placement], .ad-sticky-bottom, ins.adsbygoogle, iframe[id^="aswift"], [id^="google_ads"]'
/** Vitrines e cartões da loja: os blocos levam `loja` no nome (LojaEmLinha, LojaDeslizante, vitrines das fichas). */
const SELETOR_LOJA = '[data-bloco*="loja"]'
export const SELETOR_OBSERVADO = `${SELETOR_ANUNCIO}, ${SELETOR_LOJA}`

export function categoria(el: Element | null | undefined): Categoria {
    if (!el?.closest) return 'outro'
    if (el.closest(SELETOR_ANUNCIO)) return 'anuncio'
    if (el.closest(SELETOR_LOJA)) return 'loja'
    return 'outro'
}

/**
 * De quem é a culpa de um deslocamento de layout (CLS).
 *
 * O `layout-shift` lista os elementos que SE MOVERAM, não o que empurrou: quando
 * um anúncio cresce, quem aparece é o parágrafo de baixo. Então a causa é o
 * anúncio ou a vitrine que mudou de tamanho no mesmo quadro (ResizeObserver,
 * janela de -100 a +300 ms do deslocamento). Sem redimensionamento perto, vale o
 * próprio elemento que se moveu; senão, "outro" (imagem, fonte, conteúdo).
 */
export function atribuirDeslocamento(inicio: number, fontes: Categoria[], redimensionou: Record<Categoria, number[]>): Categoria {
    let melhor: Categoria | null = null
    let distancia = Infinity
    for (const c of ['anuncio', 'loja'] as const) {
        for (const t of redimensionou[c]) {
            const d = t - inicio
            if (d >= -100 && d <= 300 && Math.abs(d) < distancia) { melhor = c; distancia = Math.abs(d) }
        }
    }
    if (melhor) return melhor
    if (fontes.includes('anuncio')) return 'anuncio'
    if (fontes.includes('loja')) return 'loja'
    return 'outro'
}

export type ResumoAnuncios = {
    /** Anúncios preenchidos nos blocos do site, no corpo da página. */
    proprios: number
    /** Anúncios preenchidos que o Google inseriu sozinho no corpo (anúncios automáticos). */
    automaticos: number
    ancoraGoogle: boolean
    ancoraGoogleFechada: boolean
    ancoraPropria: boolean
    /** % da altura da página ocupada por anúncio no corpo (âncora e vinheta não contam: ficam por cima). */
    alturaPct: number
    /** Algum anúncio no corpo começa na primeira tela. */
    primeiraTela: boolean
}

export const RESUMO_VAZIO: ResumoAnuncios = {
    proprios: 0, automaticos: 0, ancoraGoogle: false, ancoraGoogleFechada: false, ancoraPropria: false, alturaPct: 0, primeiraTela: false,
}

/** Retrato da página agora. Chamado de tempos em tempos; o resumo final é o máximo (`juntarResumo`). */
export function resumoAnuncios(doc: Document, win: Pick<Window, 'innerHeight' | 'scrollY'>): ResumoAnuncios {
    const r = { ...RESUMO_VAZIO }
    let altura = 0
    for (const ins of doc.querySelectorAll<HTMLElement>('ins.adsbygoogle')) {
        const ancora = ins.getAttribute('data-anchor-status')
        if (ancora !== null || ins.getAttribute('data-anchor-shown') === 'true') {
            if (ancora === 'displayed' || ins.getAttribute('data-anchor-shown') === 'true') r.ancoraGoogle = true
            if (ancora === 'dismissed') { r.ancoraGoogle = true; r.ancoraGoogleFechada = true }
            continue
        }
        if (ins.hasAttribute('data-vignette-loaded')) continue
        if (ins.getAttribute('data-ad-status') !== 'filled') continue
        if (ins.closest('.ad-sticky-bottom')) { r.ancoraPropria = true; continue }
        if (ins.closest('[data-ad-placement]')) r.proprios++
        else r.automaticos++
        const caixa = ins.getBoundingClientRect()
        altura += caixa.height
        if (caixa.height > 0 && caixa.top + win.scrollY < win.innerHeight) r.primeiraTela = true
    }
    const pagina = doc.documentElement.scrollHeight
    r.alturaPct = pagina > 0 ? Math.min(100, Math.round((100 * altura) / pagina)) : 0
    return r
}

export function juntarResumo(a: ResumoAnuncios, b: ResumoAnuncios): ResumoAnuncios {
    return {
        proprios: Math.max(a.proprios, b.proprios),
        automaticos: Math.max(a.automaticos, b.automaticos),
        ancoraGoogle: a.ancoraGoogle || b.ancoraGoogle,
        ancoraGoogleFechada: a.ancoraGoogleFechada || b.ancoraGoogleFechada,
        ancoraPropria: a.ancoraPropria || b.ancoraPropria,
        alturaPct: Math.max(a.alturaPct, b.alturaPct),
        primeiraTela: a.primeiraTela || b.primeiraTela,
    }
}

/** A vinheta do Google aparece pondo `#google_vignette` no endereço. */
export const ehVinheta = (hash: string) => hash.includes('google_vignette')
