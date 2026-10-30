import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'
import { WordPressIndisponivelError } from '@/lib/wordpress/client'

const getPostSlugById = vi.fn()
vi.mock('@/lib/wordpress/posts', () => ({ getPostSlugById: (id: number) => getPostSlugById(id) }))

const chamar = (id: string) => GET(new Request(`https://www.hallyuhub.com.br/i/${id}`), { params: Promise.resolve({ id }) } as never)

describe('GET /i/[id] (link curto das redes)', () => {
    // Com chaves: um `beforeEach` que devolve o mock o faria rodar de novo como limpeza (o vitest chama a função devolvida).
    beforeEach(() => { getPostSlugById.mockReset() })

    it('redireciona para a matéria com a origem Instagram e a campanha do slug', async () => {
        getPostSlugById.mockResolvedValue('eunkwang-unfold-album-solo-btob-faixa-a-faixa')
        const res = await chamar('35235')
        expect(res.status).toBe(302)
        const destino = new URL(res.headers.get('location')!)
        expect(destino.pathname).toBe('/blog/eunkwang-unfold-album-solo-btob-faixa-a-faixa')
        expect(destino.searchParams.get('utm_source')).toBe('instagram')
        expect(destino.searchParams.get('utm_medium')).toBe('social')
        expect(destino.searchParams.get('utm_campaign')).toBe('eunkwang-unfold-album-solo-btob-faixa-a-faixa')
        expect(getPostSlugById).toHaveBeenCalledWith(35235)
        expect(res.headers.get('x-robots-tag')).toContain('noindex')
    })

    it('post inexistente: 404, sem consultar o WordPress com id inválido', async () => {
        getPostSlugById.mockResolvedValue(null)
        expect((await chamar('99999999')).status).toBe(404)
        getPostSlugById.mockClear()
        for (const ruim of ['abc', '12a', '1.5', '-3', '00000000000']) expect((await chamar(ruim)).status).toBe(404)
        expect(getPostSlugById).not.toHaveBeenCalled()
    })

    // O CMS fora do ar não pode virar "post removido": 404 cacheado apaga a página do índice do Google.
    it('WordPress indisponível: 503 com Retry-After e sem cache, nunca 404', async () => {
        getPostSlugById.mockRejectedValue(new WordPressIndisponivelError('/wp/v2/posts'))
        const res = await chamar('35235')
        expect(res.status).toBe(503)
        expect(res.headers.get('retry-after')).toBe('60')
        expect(res.headers.get('cache-control')).toBe('no-store')
    })

    it('erro inesperado não é engolido', async () => {
        getPostSlugById.mockRejectedValue(new Error('bug'))
        await expect(chamar('35235')).rejects.toThrow('bug')
    })

    it('seção do site sozinha (/i/loja) redireciona com a origem Instagram, sem consultar o WordPress', async () => {
        const res = await chamar('loja')
        expect(res.status).toBe(302)
        expect(new URL(res.headers.get('location')!).pathname).toBe('/loja')
        expect(getPostSlugById).not.toHaveBeenCalled()
    })
})
