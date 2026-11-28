import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isValidElement, type CSSProperties, type ReactElement, type ReactNode } from 'react'
import type { NextRequest } from 'next/server'

const m = vi.hoisted(() => ({ preparar: vi.fn() }))

vi.mock('@/lib/og/imagem', () => ({ prepararImagemParaOg: m.preparar }))
vi.mock('next/og', () => ({
    ImageResponse: class { constructor(public elemento: ReactElement, public opcoes: object) {} },
}))

import { GET } from './route'

type Props = { children?: ReactNode; src?: string; style?: CSSProperties }
type Resposta = { elemento: ReactElement<Props>; opcoes: object }

/** Todos os elementos da árvore desenhada. */
function elementos(no: ReactNode): ReactElement<Props>[] {
    if (Array.isArray(no)) return no.flatMap(elementos)
    if (!isValidElement<Props>(no)) return []
    return [no, ...elementos(no.props.children)]
}
const gerar = async (params: Record<string, string>) => {
    const url = new URL('https://exemplo.test/api/og')
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
    const res = await GET({ nextUrl: url } as unknown as NextRequest) as unknown as Resposta
    const todos = elementos(res.elemento)
    return { res, imagens: todos.filter(e => e.type === 'img'), textos: todos.map(e => e.props.children).filter(c => typeof c === 'string'), todos }
}
const FOTO = 'https://image.tmdb.org/t/p/w780/x.jpg'
const busca = vi.fn()

beforeEach(() => {
    // Um Response novo por chamada: o corpo só pode ser lido uma vez.
    busca.mockReset().mockImplementation(async () => new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'image/jpeg' } }))
    vi.stubGlobal('fetch', busca)
    m.preparar.mockReset().mockImplementation(async (tipo: string, bytes: Uint8Array) => ({ tipo, bytes }))
})
afterEach(() => vi.unstubAllGlobals())

describe('GET /api/og', () => {
    it('sem imagem desenha só o texto, em 1200×630, sem buscar nada', async () => {
        const { res, imagens, textos } = await gerar({ title: 'Título curto', subtitle: 'Linha de apoio' })
        expect(res.opcoes).toEqual({ width: 1200, height: 630 })
        expect(imagens).toHaveLength(0)
        expect(textos).toEqual(expect.arrayContaining(['Título curto', 'Linha de apoio']))
        expect(busca).not.toHaveBeenCalled()
    })

    it.each([[10, 64], [30, 54], [50, 44]])('título de %i letras sai com corpo %i', async (letras, corpo) => {
        const titulo = 'a'.repeat(letras)
        const { todos } = await gerar({ title: titulo })
        expect(todos.find(e => e.props.children === titulo)?.props.style?.fontSize).toBe(corpo)
    })

    it('embute a imagem como data URI no fundo e no destaque', async () => {
        const { imagens } = await gerar({ title: 'X', image: FOTO, type: 'artist' })
        expect(imagens.map(i => i.props.src)).toEqual(['data:image/jpeg;base64,AQID', 'data:image/jpeg;base64,AQID'])
        expect(imagens[1].props.style).toMatchObject({ objectFit: 'cover', objectPosition: 'center top' })
    })

    it('agência mostra o logo inteiro; outros tipos centralizam o corte', async () => {
        expect((await gerar({ title: 'X', image: FOTO, type: 'agency' })).imagens[1].props.style?.objectFit).toBe('contain')
        expect((await gerar({ title: 'X', image: FOTO, type: 'post' })).imagens[1].props.style?.objectPosition).toBe('center center')
    })

    it.each([
        ['resposta de erro', () => busca.mockResolvedValue(new Response('', { status: 500 }))],
        ['arquivo acima de 2 MB', () => busca.mockResolvedValue(new Response(new Uint8Array(2 * 1024 * 1024 + 1)))],
        ['formato que não dá para preparar', () => m.preparar.mockResolvedValue(null)],
        ['falha de rede ou prazo', () => busca.mockRejectedValue(new Error('timeout'))],
    ])('com %s entrega a prévia sem imagem', async (_, falhar) => {
        falhar()
        const { imagens, textos } = await gerar({ title: 'X', image: FOTO })
        expect(imagens).toHaveLength(0)
        expect(textos).toContain('X')
    })
})
