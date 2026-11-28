import { describe, it, expect, vi, afterEach } from 'vitest'
import { getCompaniesByChaebolGroup } from './companies'

describe('grupo empresarial com mais de 100 fichas no acervo', () => {
    afterEach(() => vi.unstubAllGlobals())

    it('encontra empresas que estão a partir da segunda página', async () => {
        const fetchMock = vi.fn(async (url: string) => {
            const segunda = new URL(url).searchParams.get('page') === '2'
            const item = segunda
                ? { id: 101, slug: 'hyundai-motor', title: { rendered: 'Hyundai Motor' }, acf: { chaebol_group: 'Hyundai Group' } }
                : { id: 1, slug: 'naver', title: { rendered: 'Naver' }, acf: {} }
            return { ok: true, headers: new Headers({ 'X-WP-TotalPages': '2' }), json: async () => [item] }
        })
        vi.stubGlobal('fetch', fetchMock)

        const achado = await getCompaniesByChaebolGroup('hyundai-group')

        expect(achado?.companies.map(c => c.slug)).toEqual(['hyundai-motor'])
        expect(fetchMock).toHaveBeenCalledTimes(2)
    })
})
