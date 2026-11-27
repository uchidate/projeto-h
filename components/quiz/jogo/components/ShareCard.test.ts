// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { generateShareCard, type ShareCardProps } from './ShareCard'

// Cobre o cartão de resultado do quiz: tamanho de story, textos desenhados, faixa de sequência só a partir
// de três, quebra e ajuste do título para caber, e retorno nulo sem canvas.
const textos: { texto: string; x: number; y: number; fonte: string }[] = []
const LARGURA_UTIL = 720 - 112

// Cada caractere mede 0,6 da fonte; os do japonês, a fonte inteira.
const medir = (texto: string, fonte: string) => {
    const px = Number(fonte.match(/(\d+)px/)![1])
    return Array.from(texto).reduce((soma, c) => soma + px * (c.charCodeAt(0) > 0x2e80 ? 1 : 0.6), 0)
}

function contexto() {
    const ctx = {
        font: '10px sans-serif', fillStyle: '', textAlign: 'left', textBaseline: '',
        createLinearGradient: () => ({ addColorStop: vi.fn() }),
        fillRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), arcTo: vi.fn(), closePath: vi.fn(), fill: vi.fn(),
        measureText: (t: string) => ({ width: medir(t, ctx.font) }),
        fillText: (texto: string, x: number, y: number) => { textos.push({ texto, x, y, fonte: ctx.font }) },
    }
    return ctx
}

const props = (extra: Partial<ShareCardProps> = {}): ShareCardProps => ({
    title: 'Muito bom!', score: 7, total: 10, points: 900, streak: 4, accent: '#f0f',
    labels: { header: 'CABECALHO', myResult: 'Meu resultado', scoreLine: '7 de 10', streakLine: 'Sequência de 4', cta: 'Faça o seu' },
    ...extra,
})

let canvas: HTMLCanvasElement | null = null
const png = new Blob(['png'], { type: 'image/png' })

beforeEach(() => {
    textos.length = 0
    canvas = null
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => contexto() as never)
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (this: HTMLCanvasElement, cb) {
        canvas = { width: this.width, height: this.height } as HTMLCanvasElement
        cb(png)
    })
})
afterEach(() => vi.restoreAllMocks())

const escritos = () => textos.map((t) => t.texto)
const doTitulo = () => textos.filter((t) => t.fonte.includes('Georgia'))

describe('generateShareCard', () => {
    it('gera um PNG no formato de story (720x1280)', async () => {
        expect(await generateShareCard(props())).toBe(png)
        expect(canvas!.width).toBe(720)
        expect(canvas!.height).toBe(1280)
        expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png')
    })

    it('sem canvas no navegador, devolve nulo', async () => {
        vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null)
        expect(await generateShareCard(props())).toBeNull()
    })

    it('desenha cabeçalho, resultado, título, placar, sequência e chamada', async () => {
        await generateShareCard(props())
        expect(escritos()).toEqual(['CABECALHO', 'Meu resultado', 'Muito bom!', '7 de 10', 'Sequência de 4', 'Faça o seu'])
    })

    it('sequência menor que três não aparece', async () => {
        await generateShareCard(props({ streak: 2 }))
        expect(escritos()).not.toContain('Sequência de 4')
        textos.length = 0
        await generateShareCard(props({ streak: 3 }))
        expect(escritos()).toContain('Sequência de 4')
    })

    it('título longo quebra nos espaços, uma linha abaixo da outra', async () => {
        await generateShareCard(props({ title: 'Continue tentando!' }))
        expect(doTitulo().map((t) => [t.texto, t.y])).toEqual([['Continue', 730], ['tentando!', 826]])
        expect(doTitulo()[0].fonte).toContain('96px')
    })

    it('palavra mais larga que a área reduz a fonte até caber', async () => {
        await generateShareCard(props({ title: 'パーフェクト！' }))
        const [linha] = doTitulo()
        expect(linha.fonte).not.toContain('96px')
        expect(medir(linha.texto, linha.fonte)).toBeLessThanOrEqual(LARGURA_UTIL)
    })

    it('a fonte do título não vaza para o placar', async () => {
        await generateShareCard(props({ title: 'パーフェクト！' }))
        expect(textos.find((t) => t.texto === '7 de 10')!.fonte).toBe('600 30px Arial, sans-serif')
    })
})
