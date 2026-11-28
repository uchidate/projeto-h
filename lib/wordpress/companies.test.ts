import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getCompanyBySlug, getCompaniesByIds, getRelatedCompanies, findCompanyByName, countCompaniesInChaebolGroup, getCompaniesByChaebolGroup, rotuloDoSetor, emojiDoSetor } from './companies'

function company(id: number, slug: string) {
    return { id, slug, title: { rendered: slug } }
}

describe('getCompanyBySlug', () => {
    let fetchMock: ReturnType<typeof vi.fn>
    beforeEach(() => { fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock) })
    afterEach(() => vi.unstubAllGlobals())

    it('retorna a company quando a API acha um resultado', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [company(1, 'samsung')] })
        expect(await getCompanyBySlug('samsung')).toEqual(company(1, 'samsung'))
    })

    it('retorna null quando a API não acha nenhum resultado', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
        expect(await getCompanyBySlug('inexistente')).toBeNull()
    })
})

describe('getCompaniesByIds', () => {
    let fetchMock: ReturnType<typeof vi.fn>
    beforeEach(() => { fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock) })
    afterEach(() => vi.unstubAllGlobals())

    it('retorna array vazio sem fetch quando ids é vazio', async () => {
        expect(await getCompaniesByIds([])).toEqual([])
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('retorna array vazio quando a API falha (erro tratado)', async () => {
        fetchMock.mockRejectedValue(new Error('network error'))
        expect(await getCompaniesByIds([1, 2])).toEqual([])
    })

    it('retorna as companies quando a API responde ok', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [company(1, 'samsung'), company(2, 'lg')] })
        expect(await getCompaniesByIds([1, 2])).toEqual([company(1, 'samsung'), company(2, 'lg')])
    })
})

describe('getRelatedCompanies', () => {
    let fetchMock: ReturnType<typeof vi.fn>
    beforeEach(() => { fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock) })
    afterEach(() => vi.unstubAllGlobals())

    it('retorna array vazio quando a API falha (erro tratado)', async () => {
        fetchMock.mockRejectedValue(new Error('network error'))
        expect(await getRelatedCompanies(1)).toEqual([])
    })

    it('rotaciona o pool com base no excludeId e limita ao perPage', async () => {
        const pool = [company(1, 'a'), company(2, 'b'), company(3, 'c'), company(4, 'd')]
        fetchMock.mockResolvedValue({ ok: true, json: async () => pool })
        // excludeId=10, pool.length=4 -> seed = 10 % 4 = 2 -> rotacionado: [c, d, a, b]
        const result = await getRelatedCompanies(10, undefined, 3)
        expect(result).toEqual([company(3, 'c'), company(4, 'd'), company(1, 'a')])
    })

    it('não quebra quando o pool retornado está vazio (seed % 0)', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => [] })
        expect(await getRelatedCompanies(5)).toEqual([])
    })
})

describe('rotuloDoSetor', () => {
    it('devolve o rótulo dos setores que o código conhece', () => {
        expect(rotuloDoSetor('tech')).toBe('Tecnologia')
        expect(rotuloDoSetor('automotive')).toBe('Automotivo')
    })

    it('entende os nomes que o WordPress grava de outro jeito', () => {
        // Supernal e Boston Dynamics chegam como `technology`, Netflix Korea
        // como `streaming`; antes viravam "— undefined" no título da página.
        expect(rotuloDoSetor('technology')).toBe('Tecnologia')
        expect(rotuloDoSetor('streaming')).toBe('Mídia')
    })

    it('devolve null para o desconhecido em vez de "undefined"', () => {
        expect(rotuloDoSetor('robotica')).toBeNull()
        expect(rotuloDoSetor(undefined)).toBeNull()
        expect(rotuloDoSetor('')).toBeNull()
    })
})

describe('emojiDoSetor', () => {
    it('acompanha os sinônimos e cai no prédio quando não conhece', () => {
        expect(emojiDoSetor('technology')).toBe(emojiDoSetor('tech'))
        expect(emojiDoSetor('robotica')).toBe('🏢')
        expect(emojiDoSetor(null)).toBe('🏢')
    })
})

describe('grupo empresarial (texto livre em chaebol_group)', () => {
    let fetchMock: ReturnType<typeof vi.fn>
    const doGrupo = (id: number, nome: string, grupo?: string) =>
        ({ ...company(id, nome.toLowerCase().replace(/ /g, '-')), title: { rendered: nome }, acf: { chaebol_group: grupo } })
    const acervo = [
        doGrupo(1, 'Samsung Electronics', 'Samsung Group'),
        doGrupo(2, 'Samsung C&amp;T', ' samsung group '),
        doGrupo(3, 'Naver'),
        doGrupo(4, 'LG', 'LG Group'),
    ]
    const responder = (itens: unknown[]) =>
        fetchMock.mockResolvedValue({ ok: true, headers: new Headers(), json: async () => itens })
    beforeEach(() => { fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock) })
    afterEach(() => vi.unstubAllGlobals())

    it('acha a ficha pelo nome exato, sem diferenciar maiúsculas', async () => {
        responder(acervo)
        expect(await findCompanyByName('naver')).toEqual({ slug: 'naver', name: 'Naver' })
        expect(await findCompanyByName('Samsung')).toBeNull()
    })

    it('conta e lista as empresas do grupo apesar de espaços e caixa', async () => {
        responder(acervo)
        expect(await countCompaniesInChaebolGroup('Samsung Group')).toBe(2)
        const achado = await getCompaniesByChaebolGroup('samsung-group')
        expect(achado?.groupName).toBe('Samsung Group')
        expect(achado?.companies.map(c => c.id)).toEqual([1, 2])
    })

    it('grupo desconhecido devolve null', async () => {
        responder(acervo)
        expect(await getCompaniesByChaebolGroup('hyundai-group')).toBeNull()
    })

    it('com a API fora não quebra a página', async () => {
        fetchMock.mockRejectedValue(new Error('network error'))
        expect(await findCompanyByName('Naver')).toBeNull()
        expect(await countCompaniesInChaebolGroup('Samsung Group')).toBe(0)
    })

    it('nas relacionadas, o mesmo grupo vem primeiro e sem repetir', async () => {
        responder([acervo[2], acervo[1], acervo[3]])
        const relacionadas = await getRelatedCompanies(1, 'tech', 3, 'Samsung Group')
        expect(relacionadas[0].id).toBe(2)
        expect(relacionadas.map(c => c.id).sort()).toEqual([2, 3, 4])
    })
})
