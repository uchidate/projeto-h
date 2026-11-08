import { beforeEach, describe, expect, it, vi } from 'vitest'

const getPosts = vi.fn()
let falha = false
vi.mock('@/lib/wordpress/posts', () => ({ getPosts: (...a: unknown[]) => (falha ? Promise.reject(new Error('x')) : getPosts(...a)) }))

import { postsTraduzidosPorSlugPt } from './guias-traduzidos'

const post = (slug: string, translations?: Record<string, string>) => ({ slug, translations }) as never

describe('postsTraduzidosPorSlugPt', () => {
    beforeEach(() => { getPosts.mockReset(); falha = false })

    it('em português não consulta nada', async () => {
        expect((await postsTraduzidosPorSlugPt('pt', ['han'])).size).toBe(0)
        expect(getPosts).not.toHaveBeenCalled()
    })

    it('acha o traduzido pelo campo translations do original e indexa pelo slug em português', async () => {
        getPosts
            .mockResolvedValueOnce({ items: [post('han', { pt: 'han', es: 'han-es' }), post('nunchi', { pt: 'nunchi' })] })
            .mockResolvedValueOnce({ items: [post('han-es', { pt: 'han', es: 'han-es' })] })
        const mapa = await postsTraduzidosPorSlugPt('es', ['han', 'nunchi'])
        expect([...mapa.keys()]).toEqual(['han'])
        expect(getPosts).toHaveBeenLastCalledWith(expect.objectContaining({ lang: 'es', slug: 'han-es' }))
    })

    it('sem nenhuma tradução publicada não faz a segunda consulta', async () => {
        getPosts.mockResolvedValueOnce({ items: [post('han', { pt: 'han' })] })
        expect((await postsTraduzidosPorSlugPt('es', ['han'])).size).toBe(0)
        expect(getPosts).toHaveBeenCalledTimes(1)
    })

    it('falha de rede vira mapa vazio, não erro na página', async () => {
        falha = true
        expect((await postsTraduzidosPorSlugPt('es', ['han'])).size).toBe(0)
    })
})
