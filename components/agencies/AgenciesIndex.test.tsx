// @vitest-environment jsdom
import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'

const getAgencies = vi.fn()
const getArtists = vi.fn()
const getAllGroups = vi.fn()
const defaultCatalogLanguages = vi.fn()

vi.mock('@/lib/wordpress/agencies', () => ({ getAgencies: (...a: unknown[]) => getAgencies(...a) }))
vi.mock('@/lib/wordpress/artists', () => ({ getArtists: (...a: unknown[]) => getArtists(...a) }))
vi.mock('@/lib/wordpress/groups', () => ({ getAllGroups: (...a: unknown[]) => getAllGroups(...a) }))
vi.mock('@/components/features/LocalizedCatalog', () => ({ defaultCatalogLanguages: (...a: unknown[]) => defaultCatalogLanguages(...a) }))
vi.mock('next/image', () => ({
    // eslint-disable-next-line @next/next/no-img-element -- stub de next/image: o teste só precisa do src
    default: (p: { src: string; alt?: string }) => <img src={p.src} alt={p.alt ?? ''} />,
}))
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: (p: { href: string; children?: ReactNode; 'aria-current'?: 'page' }) => <a href={p.href} aria-current={p['aria-current']}>{p.children}</a>,
}))
vi.mock('@/components/seo/JsonLd', () => ({ JsonLd: (p: { data: unknown }) => <script data-jsonld type="application/ld+json">{JSON.stringify(p.data)}</script> }))
vi.mock('@/components/seo/PageBreadcrumb', () => ({ PageBreadcrumb: () => <nav data-crumb /> }))
vi.mock('@/components/ui/ResponsiveFilterBar', () => ({
    ResponsiveFilterBar: (p: { label: string; value?: string; children?: ReactNode }) => <div data-filterbar={p.label} data-value={p.value ?? ''}>{p.children}</div>,
}))
vi.mock('@/components/ui/AdSlotInline', () => ({
    AdSlotInline: (p: { analyticsPlacement: string }) => <div data-ad={p.analyticsPlacement} />,
}))
vi.mock('@/components/ui/QuizWidget', () => ({ QuizWidget: () => <div data-quiz /> }))
vi.mock('@/lib/config/ads', () => ({ ADSENSE: { slots: { inline: 'IN' } } }))

import AgenciesPage, { generateMetadata } from './AgenciesIndex'
import { ADSENSE } from '@/lib/config/ads'

type SP = { search?: string | string[]; type?: string; sortBy?: string }

const BIG4 = ['sm-entertainment', 'hybe', 'yg-entertainment', 'jyp-entertainment']

let seq = 0
const agencia = (slug: string, nome: string, over: Record<string, unknown> = {}) => ({
    id: ++seq, slug, title: { rendered: nome }, excerpt: { rendered: '' }, acf: {}, ...over,
})
const item = (id: number, nome: string, agencyId: number, img = true) => ({
    id, slug: nome.toLowerCase(), title: { rendered: nome }, acf: { agency: agencyId }, ...(img ? { featured_image_url: `/i/${id}.jpg` } : {}),
})

async function pagina(sp: SP = {}) {
    const el = await AgenciesPage({ searchParams: Promise.resolve(sp) })
    return render(el)
}
const cards = (c: HTMLElement) => [...c.querySelectorAll('a[href^="/agencies/"]')].map(a => a.getAttribute('href')!.replace('/agencies/', ''))

function dados(agencias: unknown[], artistas: unknown[] = [], grupos: unknown[] = []) {
    getAgencies.mockResolvedValue({ items: agencias })
    getArtists.mockResolvedValue({ items: artistas })
    getAllGroups.mockResolvedValue(grupos)
}

beforeEach(() => {
    seq = 0
    getAgencies.mockReset()
    getArtists.mockReset()
    getAllGroups.mockReset()
    defaultCatalogLanguages.mockReset()
    defaultCatalogLanguages.mockResolvedValue({ en: 'https://x/en/agencies' })
    ;(ADSENSE.slots as { inline: string }).inline = 'IN'
    dados([])
})
afterEach(cleanup)

describe('AgenciesIndex · consulta e ordenação', () => {
    it('pede as agências ordenadas por título e repassa a busca aparada', async () => {
        dados([agencia('x', 'X')])
        await pagina({ search: '  hybe  ' })
        expect(getAgencies).toHaveBeenCalledWith({ perPage: 100, orderby: 'title', order: 'asc', search: 'hybe' })
    })

    it('sem busca, search vai undefined', async () => {
        await pagina()
        expect(getAgencies.mock.calls[0][0].search).toBeUndefined()
    })

    it('padrão (elenco): Big 4 primeiro, depois maior elenco, depois nome', async () => {
        dados([
            agencia('pequena', 'Pequena', { acf: { artists_count: 2 } }),
            agencia('grande', 'Grande', { acf: { artists_count: 50 } }),
            agencia('hybe', 'HYBE', { acf: { artists_count: 5 } }),
            agencia('a-empate', 'A Empate', { acf: { artists_count: 2 } }),
        ])
        const { container } = await pagina()
        expect(cards(container)).toEqual(['hybe', 'grande', 'a-empate', 'pequena'])
    })

    it('sortBy=name ordena de A a Z', async () => {
        dados([agencia('b', 'Beta'), agencia('a', 'Alfa'), agencia('c', 'Gama')])
        const { container } = await pagina({ sortBy: 'name' })
        expect(cards(container)).toEqual(['a', 'b', 'c'])
    })

    it('sortBy=founded: mais antigas primeiro; sem ano vão para o fim', async () => {
        dados([
            agencia('nova', 'Nova', { acf: { founded_year: 2015 } }),
            agencia('sem-ano', 'SemAno'),
            agencia('antiga', 'Antiga', { acf: { founded_year: 1995 } }),
        ])
        const { container } = await pagina({ sortBy: 'founded' })
        expect(cards(container)).toEqual(['antiga', 'nova', 'sem-ano'])
    })

    it('sortBy desconhecido volta ao padrão de elenco', async () => {
        dados([agencia('a', 'A', { acf: { artists_count: 1 } }), agencia('b', 'B', { acf: { artists_count: 9 } })])
        const { container } = await pagina({ sortBy: 'xyz' })
        expect(cards(container)).toEqual(['b', 'a'])
    })
})

describe('AgenciesIndex · filtro por tipo', () => {
    const todas = () => [
        agencia('hybe', 'HYBE'),
        agencia('indie', 'Indie'),
        agencia('selo', 'Selo', { agency_type: 'subsidiary' }),
    ]

    it('big4 só mostra as quatro grandes', async () => {
        dados(todas())
        const { container } = await pagina({ type: 'big4' })
        expect(cards(container)).toEqual(['hybe'])
    })

    it('subsidiary só mostra subsidiárias', async () => {
        dados(todas())
        const { container } = await pagina({ type: 'subsidiary' })
        expect(cards(container)).toEqual(['selo'])
        expect(container.textContent).toContain('1 subsidiárias')
    })

    it('mid exclui Big 4 e subsidiárias e usa o cabeçalho de independentes', async () => {
        dados(todas())
        const { container } = await pagina({ type: 'mid' })
        expect(cards(container)).toEqual(['indie'])
        expect(container.textContent).toContain('Mid & Independentes')
        expect(container.textContent).not.toContain('Outras agências')
    })

    it('tipo inválido vale como "todas"', async () => {
        dados(todas())
        const { container } = await pagina({ type: 'qualquer' })
        expect(cards(container)).toHaveLength(3)
    })

    it('as quatro Big 4 conhecidas são reconhecidas', async () => {
        dados(BIG4.map(s => agencia(s, s)))
        const { container } = await pagina({ type: 'big4' })
        expect(cards(container).sort()).toEqual([...BIG4].sort())
    })
})

describe('AgenciesIndex · seções', () => {
    it('Big 4 e "Outras agências" em seções separadas', async () => {
        dados([agencia('hybe', 'HYBE'), agencia('indie', 'Indie')])
        const { container } = await pagina()
        const h2 = [...container.querySelectorAll('h2')].map(h => h.textContent!.trim())
        expect(h2).toEqual(['Big 4', 'Outras agências'])
    })

    it('sem Big 4, não há cabeçalho de "Outras agências"', async () => {
        dados([agencia('indie', 'Indie')])
        const { container } = await pagina()
        expect(container.querySelectorAll('h2')).toHaveLength(0)
    })

    it('anúncio entre Big 4 e as demais só quando as duas existem', async () => {
        dados([agencia('hybe', 'HYBE'), agencia('indie', 'Indie')])
        const com = await pagina()
        expect([...com.container.querySelectorAll('[data-ad]')].map(e => e.getAttribute('data-ad'))).toContain('agencies_feed')
        cleanup()
        dados([agencia('hybe', 'HYBE')])
        const so = await pagina()
        expect(so.container.querySelector('[data-ad="agencies_feed"]')).toBeNull()
    })

    it('grade das demais é cortada de 12 em 12, com anúncio entre os blocos', async () => {
        dados(Array.from({ length: 25 }, (_, i) => agencia(`a${i}`, `Agência ${String(i).padStart(2, '0')}`)))
        const { container } = await pagina({ sortBy: 'name' })
        expect(container.querySelectorAll('[data-ad="agencies_grid"]')).toHaveLength(2)
        expect(cards(container)).toHaveLength(25)
    })

    it('sem slot de anúncio, a grade fica inteira e sem anúncios', async () => {
        ;(ADSENSE.slots as { inline: string }).inline = ''
        dados(Array.from({ length: 25 }, (_, i) => agencia(`a${i}`, `Agência ${i}`)))
        const { container } = await pagina()
        expect(container.querySelectorAll('[data-ad]')).toHaveLength(0)
        expect(cards(container)).toHaveLength(25)
    })

    it('contagem no singular e no plural', async () => {
        dados([agencia('a', 'A')])
        expect((await pagina()).container.textContent).toContain('1 agência encontrada')
        cleanup()
        dados([agencia('a', 'A'), agencia('b', 'B')])
        expect((await pagina()).container.textContent).toContain('2 agências encontradas')
    })
})

describe('AgenciesIndex · estado vazio', () => {
    it('sem busca: sugere remover filtros', async () => {
        const { container } = await pagina({ type: 'big4' })
        expect(container.textContent).toContain('Nenhuma agência encontrada')
        expect(container.textContent).toContain('Tente remover os filtros selecionados.')
        // Sem resultados não há contador "N agências encontradas".
        expect(container.querySelector('[aria-live]')).toBeNull()
    })

    it('com busca: cita o termo', async () => {
        const { container } = await pagina({ search: 'xyz' })
        expect(container.textContent).toContain('Não encontramos resultados para “xyz”.')
    })

    it('falha de uma das fontes não derruba a página', async () => {
        getAgencies.mockResolvedValue({ items: [agencia('a', 'A')] })
        getArtists.mockRejectedValue(new Error('WP fora'))
        getAllGroups.mockRejectedValue(new Error('WP fora'))
        const { container } = await pagina()
        expect(cards(container)).toEqual(['a'])
    })

    it('falha na lista de agências mostra o estado vazio', async () => {
        getAgencies.mockRejectedValue(new Error('WP fora'))
        const { container } = await pagina()
        expect(container.textContent).toContain('Nenhuma agência encontrada')
    })
})

describe('AgenciesIndex · filtros e links', () => {
    const href = (c: HTMLElement, rotulo: string) =>
        [...c.querySelectorAll('[data-filterbar] a')].find(a => a.textContent!.trim().startsWith(rotulo))!.getAttribute('href')

    it('links de filtro preservam busca e ordenação, e limpam o que volta ao padrão', async () => {
        dados([agencia('a', 'A')])
        const { container } = await pagina({ search: 'sm', sortBy: 'name', type: 'big4' })
        expect(href(container, 'Todas')).toBe('/agencies?search=sm&sortBy=name')
        expect(href(container, 'Mid')).toBe('/agencies?search=sm&type=mid&sortBy=name')
        expect(href(container, 'Elenco')).toBe('/agencies?search=sm&type=big4')
        expect(href(container, 'Fundação')).toBe('/agencies?search=sm&type=big4&sortBy=founded')
    })

    it('sem nenhum filtro, "Todas" aponta para /agencies limpo', async () => {
        dados([agencia('a', 'A')])
        const { container } = await pagina()
        expect(href(container, 'Todas')).toBe('/agencies')
        expect(href(container, 'Elenco')).toBe('/agencies')
    })

    it('rótulo da barra resume os filtros ativos e aparece o link "Limpar"', async () => {
        dados([agencia('a', 'A')])
        const { container } = await pagina({ search: 'sm', type: 'subsidiary', sortBy: 'founded' })
        const barra = container.querySelector('[data-filterbar]')!
        expect(barra.getAttribute('data-filterbar')).toBe('Filtros: “sm”, Subsidiárias, Fundação')
        expect([...barra.querySelectorAll('a')].some(a => a.textContent!.trim() === 'Limpar' && a.getAttribute('href') === '/agencies')).toBe(true)
    })

    it('sem filtros o rótulo é só "Filtros" e não há "Limpar"', async () => {
        dados([agencia('a', 'A')])
        const { container } = await pagina()
        expect(container.querySelector('[data-filterbar]')!.getAttribute('data-filterbar')).toBe('Filtros')
        expect([...container.querySelectorAll('a')].some(a => a.textContent!.trim() === 'Limpar')).toBe(false)
    })

    it('o filtro atual marca aria-current', async () => {
        dados([agencia('a', 'A')])
        const { container } = await pagina({ type: 'big4', sortBy: 'name' })
        const atuais = [...container.querySelectorAll('[aria-current="page"]')].map(a => a.textContent!.trim())
        expect(atuais).toEqual(expect.arrayContaining(['Big 4', 'A–Z']))
        expect(atuais).toHaveLength(2)
    })

    it('formulário de busca repassa tipo e ordenação como campos ocultos', async () => {
        dados([agencia('a', 'A')])
        const { container } = await pagina({ search: 'sm', type: 'mid', sortBy: 'name' })
        const form = container.querySelector('form')!
        expect(form.querySelector('input[name="type"]')?.getAttribute('value')).toBe('mid')
        expect(form.querySelector('input[name="sortBy"]')?.getAttribute('value')).toBe('name')
        expect((form.querySelector('input[name="search"]') as HTMLInputElement).defaultValue).toBe('sm')
    })

    it('sem filtros, o formulário não tem campos ocultos', async () => {
        const { container } = await pagina()
        expect(container.querySelectorAll('form input[type="hidden"]')).toHaveLength(0)
    })

    it('quiz só na página sem filtro nem busca', async () => {
        dados([agencia('a', 'A')])
        expect((await pagina()).container.querySelector('[data-quiz]')).not.toBeNull()
        cleanup()
        expect((await pagina({ search: 'x' })).container.querySelector('[data-quiz]')).toBeNull()
        cleanup()
        expect((await pagina({ type: 'mid' })).container.querySelector('[data-quiz]')).toBeNull()
        cleanup()
        expect((await pagina({ sortBy: 'name' })).container.querySelector('[data-quiz]')).toBeNull()
    })
})

describe('AgenciesIndex · cartão', () => {
    it('colagem do elenco usa grupos e artistas com foto (4 no destaque, 5 nos demais)', async () => {
        const hybe = agencia('hybe', 'HYBE')
        const outra = agencia('outra', 'Outra')
        const grupos = [item(100, 'G1', hybe.id), item(101, 'G2', hybe.id)]
        const artistas = [200, 201, 202, 203].map(i => item(i, `A${i}`, hybe.id))
        const outrosArtistas = [300, 301, 302, 303, 304, 305, 306].map(i => item(i, `B${i}`, outra.id))
        dados([hybe, outra], [...artistas, ...outrosArtistas], grupos)
        const { container } = await pagina()
        const [cardHybe, cardOutra] = [...container.querySelectorAll('a[href^="/agencies/"]')]
        expect(cardHybe.querySelectorAll('img')).toHaveLength(4)
        expect(cardOutra.querySelectorAll('img')).toHaveLength(5)
    })

    it('item de elenco sem foto não entra na colagem', async () => {
        const ag = agencia('indie', 'Indie')
        dados([ag], [item(1, 'Sem Foto', ag.id, false), item(2, 'Com Foto', ag.id)])
        const { container } = await pagina()
        const imgs = [...container.querySelectorAll('a[href="/agencies/indie"] img')].map(i => i.getAttribute('alt'))
        expect(imgs).toEqual(['Com Foto'])
    })

    it('sem elenco com foto usa o logo; sem logo, a sigla', async () => {
        dados([
            agencia('com-logo', 'Com Logo', { featured_image_url: '/logo.png' }),
            agencia('so-sigla', 'Só Sigla'),
        ])
        const { container } = await pagina({ sortBy: 'name' })
        const [logo, sigla] = [...container.querySelectorAll('a[href^="/agencies/"]')]
        expect(logo.querySelector('img')?.getAttribute('src')).toBe('/logo.png')
        expect(sigla.querySelector('img')).toBeNull()
        expect(sigla.textContent).toContain('Só Sigla')
    })

    it('classificação: Big 4, Subsidiária e Grande agência', async () => {
        dados([
            agencia('hybe', 'HYBE'),
            agencia('selo', 'Selo', { agency_type: 'subsidiary' }),
            agencia('major', 'Major', { agency_type: 'major' }),
            agencia('plain', 'Plain'),
        ])
        const { container } = await pagina({ sortBy: 'name' })
        const texto = (slug: string) => container.querySelector(`a[href="/agencies/${slug}"]`)!.textContent!
        expect(texto('hybe')).toContain('Big 4')
        expect(texto('selo')).toContain('Subsidiária')
        expect(texto('major')).toContain('Grande agência')
        expect(texto('plain')).not.toMatch(/Big 4|Subsidiária|Grande agência/)
    })

    it('rodapé: fundação, elenco no singular/plural e "sem elenco"', async () => {
        dados([
            agencia('a', 'A', { acf: { founded_year: 1996, artists_count: 1 } }),
            agencia('b', 'B', { acf: { artists_count: 30 } }),
            agencia('c', 'C'),
        ])
        const { container } = await pagina({ sortBy: 'name' })
        const texto = (slug: string) => container.querySelector(`a[href="/agencies/${slug}"]`)!.textContent!
        expect(texto('a')).toContain('1996')
        expect(texto('a')).toContain('1 nome no elenco')
        expect(texto('b')).toContain('30 nomes no elenco')
        expect(texto('c')).toContain('Sem elenco cadastrado')
    })

    it('sem artists_count, a contagem usa as listas de grupos e artistas', async () => {
        const ag = agencia('indie', 'Indie')
        dados([ag], [item(1, 'A', ag.id)], [item(2, 'G', ag.id)])
        const { container } = await pagina()
        expect(container.textContent).toContain('2 nomes no elenco')
    })

    it('descrição vem do resumo sem HTML; nome em hangul aparece quando existe', async () => {
        dados([agencia('a', 'A', { excerpt: { rendered: '<p>Agência <b>forte</b></p>' }, acf: { name_hangul: '에이' } })])
        const { container } = await pagina()
        expect(container.textContent).toContain('Agência forte')
        expect(container.textContent).not.toContain('<b>')
        expect(container.textContent).toContain('에이')
    })
})

describe('AgenciesIndex · JSON-LD', () => {
    it('lista as agências filtradas, na ordem exibida, com URL absoluta', async () => {
        dados([agencia('b', 'Beta'), agencia('a', 'Alfa')])
        const { container } = await pagina({ sortBy: 'name' })
        const ld = JSON.parse(container.querySelector('script[data-jsonld]')!.textContent!)
        expect(ld['@type']).toBe('CollectionPage')
        expect(ld.mainEntity.numberOfItems).toBe(2)
        expect(ld.mainEntity.itemListElement.map((i: { name: string; position: number }) => `${i.position}:${i.name}`)).toEqual(['1:Alfa', '2:Beta'])
        expect(ld.mainEntity.itemListElement[0].url).toMatch(/^https?:\/\/.+\/agencies\/a$/)
    })
})

describe('AgenciesIndex · metadados', () => {
    it('sem filtro: canônica, idiomas alternativos e indexável', async () => {
        const m = await generateMetadata({ searchParams: Promise.resolve({}) })
        expect(m.alternates?.canonical).toMatch(/\/agencies$/)
        expect(m.alternates?.languages).toEqual({ en: 'https://x/en/agencies' })
        expect(m.robots).toBeUndefined()
        expect(defaultCatalogLanguages).toHaveBeenCalledWith('agencies')
    })

    it.each([
        ['busca', { search: 'sm' }],
        ['tipo', { type: 'big4' }],
        ['ordem', { sortBy: 'name' }],
    ])('filtro por %s: noindex e sem idiomas alternativos', async (_n, sp) => {
        const m = await generateMetadata({ searchParams: Promise.resolve(sp) })
        expect(m.robots).toEqual({ index: false, follow: true })
        expect(m.alternates?.languages).toBeUndefined()
        expect(defaultCatalogLanguages).not.toHaveBeenCalled()
    })

    it('busca só com espaços não conta como filtro', async () => {
        const m = await generateMetadata({ searchParams: Promise.resolve({ search: '   ' }) })
        expect(m.robots).toBeUndefined()
    })
})
