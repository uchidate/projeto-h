import { describe, it, expect } from 'vitest'
import { GET } from './route'

const chamar = (caminho: string[]) => GET(new Request('https://www.hallyuhub.com.br/i/x'), { params: Promise.resolve({ caminho }) } as never)

describe('GET /i/[...caminho] (link curto de fichas e seções)', () => {
    it('ficha: redireciona com a origem Instagram e a campanha igual ao caminho', async () => {
        const res = await chamar(['artists', 'cha-eunwoo'])
        expect(res.status).toBe(302)
        const destino = new URL(res.headers.get('location')!)
        expect(destino.pathname).toBe('/artists/cha-eunwoo')
        expect(destino.searchParams.get('utm_source')).toBe('instagram')
        expect(destino.searchParams.get('utm_campaign')).toBe('artists/cha-eunwoo')
        expect(res.headers.get('x-robots-tag')).toContain('noindex')
    })

    it('seção: um trecho só', async () => {
        const res = await chamar(['loja'])
        expect(new URL(res.headers.get('location')!).pathname).toBe('/loja')
    })

    it('recusa seção fora da lista, caminho longo e trecho estranho (sem redirecionador aberto)', async () => {
        for (const ruim of [['admin', 'x'], ['artists', 'a', 'b'], ['artists', '..'], ['artists', '%2F%2Fevil.com'], ['artists', 'a b'], ['artists', '']]) {
            expect((await chamar(ruim)).status).toBe(404)
        }
    })
})
