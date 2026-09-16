import { describe, expect, it } from 'vitest'
import { splitContentForAds } from './injectAd'

const p = (text: string) => `<p>${text}</p>`
const shortParas = (n: number) => Array.from({ length: n }, (_, i) => p(`Frase curta ${i}.`)).join('')
const longParas = (n: number) => Array.from({ length: n }, (_, i) => p(`Parágrafo ${i} com texto jornalístico longo o bastante para representar conteúdo real de matéria, com contexto, citação e desdobramento suficientes para ocupar espaço na tela do leitor. `.repeat(3))).join('')

describe('splitContentForAds', () => {
    it('artigo de parágrafos CURTOS não empilha anúncios — exige texto real entre eles', () => {
        // Caso reportado ao vivo (2026-07-12): matéria K-news com parágrafos de
        // uma frase mostrava vários anúncios um embaixo do outro.
        const segments = splitContentForAds(shortParas(16))
        // 16 parágrafos × ~15 chars ≈ 240 chars totais — nenhum breakpoint
        // atinge os 800 chars mínimos: nada de anúncio no corpo.
        expect(segments).toHaveLength(1)
    })

    it('artigo longo de verdade recebe até maxAds com distância de texto', () => {
        const segments = splitContentForAds(longParas(16))
        expect(segments.length).toBeGreaterThan(1)
        expect(segments.length).toBeLessThanOrEqual(4) // maxAds 3 → 4 segmentos
        // todo segmento entre anúncios carrega o mínimo de texto
        for (const seg of segments.slice(0, -1)) {
            expect(seg.replace(/<[^>]*>/g, '').length).toBeGreaterThanOrEqual(800)
        }
    })

    it('não deixa anúncio pendurado sem conteúdo depois', () => {
        const segments = splitContentForAds(longParas(5))
        const last = segments[segments.length - 1]
        expect(last.replace(/<[^>]*>/g, '').length).toBeGreaterThanOrEqual(400)
    })

    it('artigo curto demais fica sem anúncio no corpo', () => {
        expect(splitContentForAds(longParas(3))).toHaveLength(1)
    })
})
