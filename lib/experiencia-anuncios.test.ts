// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { atribuirDeslocamento, categoria, ehVinheta, juntarResumo, RESUMO_VAZIO, resumoAnuncios } from './experiencia-anuncios'

function caixa(el: Element, top: number, height: number) {
    el.getBoundingClientRect = () => ({ top, height, bottom: top + height, left: 0, right: 300, width: 300, x: 0, y: top, toJSON: () => ({}) })
}

describe('resumoAnuncios', () => {
    it('separa anúncio do site, automático, âncoras e vinheta', () => {
        document.body.innerHTML = `
          <div data-ad-placement="article_body"><ins class="adsbygoogle" data-ad-status="filled" id="a"></ins></div>
          <div data-ad-placement="article_sidebar"><ins class="adsbygoogle" data-ad-status="unfilled"></ins></div>
          <p><ins class="adsbygoogle" data-ad-status="filled" id="auto"></ins></p>
          <div class="ad-sticky-bottom"><ins class="adsbygoogle" data-ad-status="filled"></ins></div>
          <ins class="adsbygoogle" data-anchor-status="dismissed"></ins>
          <ins class="adsbygoogle" data-vignette-loaded="true" data-ad-status="filled"></ins>`
        caixa(document.getElementById('a')!, 100, 250)
        caixa(document.getElementById('auto')!, 3000, 250)
        Object.defineProperty(document.documentElement, 'scrollHeight', { value: 5000, configurable: true })
        const r = resumoAnuncios(document, { innerHeight: 800, scrollY: 0 })
        expect(r).toEqual({ proprios: 1, automaticos: 1, ancoraGoogle: true, ancoraGoogleFechada: true, ancoraPropria: true, alturaPct: 10, primeiraTela: true })
    })

    it('juntarResumo guarda o máximo de cada retrato', () => {
        const a = { ...RESUMO_VAZIO, proprios: 2, ancoraGoogle: true }
        const b = { ...RESUMO_VAZIO, proprios: 1, automaticos: 3, alturaPct: 12 }
        expect(juntarResumo(a, b)).toMatchObject({ proprios: 2, automaticos: 3, ancoraGoogle: true, alturaPct: 12 })
    })
})

describe('atribuirDeslocamento', () => {
    const vazio = { anuncio: [] as number[], loja: [] as number[], outro: [] as number[] }

    it('culpa quem mudou de tamanho no mesmo quadro, não o parágrafo empurrado', () => {
        expect(atribuirDeslocamento(1000, ['outro'], { ...vazio, anuncio: [1020] })).toBe('anuncio')
        expect(atribuirDeslocamento(1000, ['outro'], { ...vazio, anuncio: [400], loja: [1010] })).toBe('loja')
    })

    it('sem redimensionamento perto, vale o elemento que se moveu', () => {
        expect(atribuirDeslocamento(1000, ['outro', 'anuncio'], { ...vazio, anuncio: [2000] })).toBe('anuncio')
        expect(atribuirDeslocamento(1000, ['outro'], vazio)).toBe('outro')
    })
})

it('categoria e vinheta', () => {
    document.body.innerHTML = '<section data-bloco="artigo-loja-meio"><a id="l"></a></section><p id="p"></p>'
    expect(categoria(document.getElementById('l'))).toBe('loja')
    expect(categoria(document.getElementById('p'))).toBe('outro')
    expect(categoria(null)).toBe('outro')
    expect(ehVinheta('#google_vignette')).toBe(true)
    expect(ehVinheta('#topo')).toBe(false)
})
