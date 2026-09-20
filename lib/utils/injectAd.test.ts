import { describe, expect, it } from 'vitest'
import { splitContentForAd, splitContentForAds, textoVisivel } from './injectAd'

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
            expect(textoVisivel(seg)).toBeGreaterThanOrEqual(800)
        }
    })

    it('não deixa anúncio pendurado sem conteúdo depois', () => {
        const segments = splitContentForAds(longParas(5))
        const last = segments[segments.length - 1]
        expect(textoVisivel(last)).toBeGreaterThanOrEqual(400)
    })

    it('artigo curto demais fica sem anúncio no corpo', () => {
        expect(splitContentForAds(longParas(3))).toHaveLength(1)
    })
})

describe('splitContentForAd', () => {
    it('corta no parágrafo pedido quando a ficha é longa', () => {
        const [antes, depois] = splitContentForAd(longParas(6), 3)
        expect(antes.match(/<\/p>/g)).toHaveLength(3)
        expect(depois).not.toBe('')
    })

    it('recua o corte em ficha curta em vez de desistir', () => {
        // O caso da massa: 1.385 fichas de artista têm exatamente 2 parágrafos.
        // Com corte fixo em 3 o anúncio nunca aparecia.
        const [antes, depois] = splitContentForAd(longParas(2), 3)
        expect(antes.match(/<\/p>/g)).toHaveLength(1)
        expect(textoVisivel(depois)).toBeGreaterThanOrEqual(400)
    })

    it('não insere anúncio quando a cauda é curta demais', () => {
        // Protege o caso que a regra original queria proteger.
        expect(splitContentForAd(shortParas(4), 3)).toEqual([shortParas(4), ''])
    })

    it('não insere anúncio em ficha de um parágrafo só', () => {
        const html = longParas(1)
        expect(splitContentForAd(html, 3)).toEqual([html, ''])
    })

    it('adaptativo:false mantém o comportamento antigo', () => {
        // Grupos: a cauda vai para o "continuar lendo", então recuar o corte
        // esconderia texto hoje visível.
        const html = longParas(2)
        expect(splitContentForAd(html, 3, 400, false)).toEqual([html, ''])
        const [antes] = splitContentForAd(longParas(6), 3, 400, false)
        expect(antes.match(/<\/p>/g)).toHaveLength(3)
    })

    it('nunca corta no último parágrafo', () => {
        const [, depois] = splitContentForAd(longParas(3), 5)
        expect(textoVisivel(depois)).toBeGreaterThanOrEqual(400)
    })
})
