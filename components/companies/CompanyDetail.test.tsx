// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { SITE_URL } from '@/lib/constants/site'
import { semTraducao } from '@/lib/i18n/entity-translation'
import {
    countCompaniesInChaebolGroup, getCompanies, getCompanyBySlug, getRelatedCompanies,
} from '@/lib/wordpress/companies'
import { buildVitrineMatcher, getVitrineVinculada } from '@/lib/wordpress/vitrine'
import { getPostsQueCitam } from '@/lib/wordpress/posts'
import { getMencoesNoAcervo } from '@/lib/wordpress/mentions'
import CompanyPage, { generateMetadata, slugsPreGerados } from './CompanyDetail'

vi.mock('next-intl/server', () => ({
    getTranslations: async () => (key: string, values?: Record<string, unknown>) =>
        values ? `${key}~${JSON.stringify(values)}` : key,
}))
vi.mock('next/navigation', () => ({
    notFound: () => { throw new Error('NEXT_NOT_FOUND') },
}))
vi.mock('@/lib/wordpress/companies', () => ({
    getCompanyBySlug: vi.fn(),
    getCompanies: vi.fn(),
    getRelatedCompanies: vi.fn(),
    countCompaniesInChaebolGroup: vi.fn(),
    emojiDoSetor: () => '🏢',
}))
vi.mock('@/lib/wordpress/vitrine', () => ({ getVitrineVinculada: vi.fn(), buildVitrineMatcher: vi.fn() }))
vi.mock('@/lib/wordpress/posts', () => ({ getPostsQueCitam: vi.fn() }))
vi.mock('@/lib/wordpress/mentions', () => ({ getMencoesNoAcervo: vi.fn() }))
vi.mock('@/lib/i18n/entity-translation', () => ({
    availableLocales: () => ['pt'],
    localizeEntity: (e: unknown) => e,
    semTraducao: vi.fn(() => false),
}))
vi.mock('@/lib/i18n/rotulos-ficha', () => ({
    rotuloDoSetorEm: async (v?: string) => (v ? `setor:${v}` : null),
}))

vi.mock('next/image', () => ({
    default: ({ src, alt }: { src: string; alt: string }) => (
        // eslint-disable-next-line @next/next/no-img-element -- stub de next/image: o teste só precisa do src
        <img src={src} alt={alt} />
    ),
}))
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: ({ href, children }: { href: string; children?: ReactNode }) => <a href={href}>{children}</a>,
}))
vi.mock('@/components/seo/JsonLd', () => ({
    JsonLd: ({ data }: { data: unknown }) => <script data-jsonld>{JSON.stringify(data)}</script>,
}))
vi.mock('@/components/ui/WpEditContext', () => ({ WpEditSetter: () => null }))
vi.mock('@/components/profiles/ProfileSection', () => ({
    ProfileSection: ({ id, children }: { id: string; children: ReactNode }) => <section data-secao={id}>{children}</section>,
}))
vi.mock('@/components/groups/GroupAnimatedStats', () => ({
    GroupAnimatedStats: ({ stats }: { stats: unknown }) => <div data-stats={JSON.stringify(stats)} />,
}))
vi.mock('@/components/companies/ConexoesChaebol', () => ({
    ConexoesChaebol: (p: unknown) => <div data-conexoes={JSON.stringify(p)} />,
}))
vi.mock('@/components/companies/CompanyFounderQuote', () => ({
    CompanyFounderQuote: (p: unknown) => <div data-quote={JSON.stringify(p)} />,
}))
vi.mock('@/components/companies/CompanyMilestonesTimeline', () => ({ CompanyMilestonesTimeline: () => <div data-timeline /> }))
vi.mock('@/components/companies/CompanyGallery', () => ({ CompanyGallery: () => <div data-galeria /> }))
vi.mock('@/components/companies/ProdutoConhecidoTile', () => ({
    ProdutoConhecidoTile: (p: { name: string; image: string | null; ofertas: { id: number }[] }) => (
        <div data-produto={p.name} data-imagem={p.image ?? ''} data-ofertas={p.ofertas.map(o => o.id).join(',')} />
    ),
}))
vi.mock('@/components/ui/LojaEmLinha', () => ({ LojaEmLinha: () => <div data-loja /> }))
vi.mock('@/components/ui/CitadoNoBlog', () => ({ CitadoNoBlog: () => <div data-citado /> }))
vi.mock('@/components/companies/MencionadoAcervo', () => ({ MencionadoAcervo: () => <div data-mencionado /> }))

type Obj = Record<string, unknown>

function empresa(over: Obj = {}, acf: Obj = {}) {
    return {
        id: 1,
        slug: 'cj-enm',
        title: { rendered: 'CJ ENM' },
        excerpt: { rendered: '<p>Conglomerado de mídia.</p>' },
        content: { rendered: '<p>Texto longo</p>' },
        modified: '2026-11-01T10:00:00',
        featured_image_url: 'https://img.test/cj.png',
        meta: {},
        acf,
        ...over,
    }
}

const relacionada = (id: number, acf: Obj = {}) => ({
    id, slug: `rel-${id}`, title: { rendered: `Rel ${id}` }, featured_image_url: `https://img.test/r${id}.png`, acf,
})

const oferta = (id: number, titulo: string, over: Obj = {}) => ({
    id, title: { rendered: titulo }, acf: { affiliate_url: `https://shop.test/${id}`, image_url: 'i.jpg', price: 10, store: 'shopee', ...over },
})

function configurar(c: unknown, extra: { vitrine?: unknown[]; posts?: unknown[]; mentions?: unknown[]; rel?: unknown[]; irmas?: number } = {}) {
    vi.mocked(getCompanyBySlug).mockResolvedValue(c as never)
    vi.mocked(getVitrineVinculada).mockResolvedValue((extra.vitrine ?? []) as never)
    vi.mocked(getPostsQueCitam).mockResolvedValue((extra.posts ?? []) as never)
    vi.mocked(getMencoesNoAcervo).mockResolvedValue((extra.mentions ?? []) as never)
    vi.mocked(getRelatedCompanies).mockResolvedValue((extra.rel ?? []) as never)
    vi.mocked(countCompaniesInChaebolGroup).mockResolvedValue(extra.irmas ?? 0)
    vi.mocked(buildVitrineMatcher).mockResolvedValue((() => false) as never)
}

async function montar(locale?: 'en') {
    return render(await CompanyPage({ params: Promise.resolve({ slug: 'cj-enm', locale }) }))
}

const json = (el: Element | null) => JSON.parse(el!.getAttribute('data-stats') ?? el!.getAttribute('data-conexoes') ?? el!.getAttribute('data-quote')!)
const secao = (c: HTMLElement, id: string) => c.querySelector(`[data-secao="${id}"]`)

beforeEach(() => {
    vi.mocked(semTraducao).mockReturnValue(false)
    configurar(empresa())
})
afterEach(() => {
    cleanup()
    vi.clearAllMocks()
})

describe('CompanyDetail: topo e estatísticas', () => {
    it('slug inexistente cai em notFound', async () => {
        vi.mocked(getCompanyBySlug).mockResolvedValue(null as never)
        await expect(CompanyPage({ params: Promise.resolve({ slug: 'x' }) })).rejects.toThrow('NEXT_NOT_FOUND')
    })

    it('mostra nome, setor, tag chaebol, nome coreano e romanizado diferente', async () => {
        configurar(empresa({}, { industry: 'media', is_chaebol: true, name_korean: 'CJ ENM', name_romanized: 'Ssi-Jei' }))
        const { container } = await montar()
        expect(container.querySelector('h1')!.textContent).toBe('CJ ENM')
        expect(container.textContent).toContain('setor:media')
        expect(container.textContent).toContain('chaebol')
        expect(container.textContent).toContain('Ssi-Jei')
    })

    it('romanizado igual ao nome não repete', async () => {
        configurar(empresa({}, { name_romanized: 'CJ ENM' }))
        const { container } = await montar()
        // O mesmo texto do nome não aparece como linha extra de romanização.
        const antes = container.textContent!.match(/CJ ENM/g)!.length
        cleanup()
        configurar(empresa({}, { name_romanized: 'Ssi-Jei' }))
        const depois = (await montar()).container.textContent!.match(/CJ ENM/g)!.length
        expect(antes).toBe(depois)
    })

    it('logo da empresa ou emoji do setor quando não há imagem', async () => {
        expect((await montar()).container.querySelector('img')!.getAttribute('src')).toBe('https://img.test/cj.png')
        cleanup()
        configurar(empresa({ featured_image_url: undefined }))
        const { container } = await montar()
        expect(container.querySelector('img')).toBeNull()
        expect(container.textContent).toContain('🏢')
    })

    it('estatísticas só com o que existe, na ordem fundação, funcionários, receita', async () => {
        configurar(empresa({}, { founded_year: 1995, employees: 12345, revenue: '₩ 4 tri' }))
        const stats = json((await montar()).container.querySelector('[data-stats]'))
        expect(stats.map((s: { label: string }) => s.label)).toEqual(['founded', 'employees', 'revenue'])
        expect(stats[0].value).toBe('1995')
        expect(stats[1].value).toMatch(/12.345/)
        cleanup()
        configurar(empresa({}, { revenue: 'x' }))
        expect(json((await montar()).container.querySelector('[data-stats]'))).toHaveLength(1)
        cleanup()
        configurar(empresa())
        expect((await montar()).container.querySelector('[data-stats]')).toBeNull()
    })

    it('links de site e Instagram, sede e ticker', async () => {
        configurar(empresa({}, { website: 'https://cj.test', instagram: 'https://ig.test/cj', headquarters: 'Seul', stock_ticker: 'KRX:035760' }))
        const { container } = await montar()
        const externos = Array.from(container.querySelectorAll('a[target="_blank"]')).map(a => a.getAttribute('href'))
        expect(externos).toEqual(['https://cj.test', 'https://ig.test/cj'])
        expect(container.textContent).toContain('📍 Seul')
        expect(container.textContent).toContain('KRX:035760')
    })
})

describe('CompanyDetail: produtos conhecidos', () => {
    const acf = { famous_products: ['Buldak (Hot Chicken)|https://img.test/b.png', 'Kimchi'] }

    it('liga ofertas cujo título tem todas as palavras-núcleo e link de afiliado', async () => {
        configurar(empresa({}, acf), {
            vitrine: [
                oferta(1, 'Lamen Coreano Apimentado BULDAK 140g'),
                oferta(2, 'Outro produto qualquer'),
                oferta(3, 'Buldak sem link', { affiliate_url: undefined }),
            ],
        })
        const { container } = await montar()
        const buldak = container.querySelector('[data-produto="Buldak (Hot Chicken)"]')!
        expect(buldak.getAttribute('data-ofertas')).toBe('1')
        expect(buldak.getAttribute('data-imagem')).toBe('https://img.test/b.png')
        const kimchi = container.querySelector('[data-produto="Kimchi"]')!
        expect(kimchi.getAttribute('data-ofertas')).toBe('')
        expect(kimchi.getAttribute('data-imagem')).toBe('')
    })

    it('combina sem acento e só aparece em português', async () => {
        configurar(empresa({}, { famous_products: ['Pão Doce'] }), { vitrine: [oferta(5, 'Pao Doce de Seul')] })
        const pt = await montar()
        expect(pt.container.querySelector('[data-produto="Pão Doce"]')!.getAttribute('data-ofertas')).toBe('5')
        pt.unmount()
        const en = await montar('en')
        expect(en.container.querySelector('[data-produto]')).toBeNull()
    })
})

describe('CompanyDetail: seções opcionais', () => {
    it('citação usa autor, fundador ou nome da empresa, nessa ordem', async () => {
        const autor = async (acf: Obj) => {
            configurar(empresa({}, { founder_quote_text: 'frase', ...acf }))
            const r = await montar()
            const a = json(r.container.querySelector('[data-quote]')).author
            r.unmount()
            return a
        }
        expect(await autor({ founder_quote_author: 'Autor', founder: 'F' })).toBe('Autor')
        expect(await autor({ founder: 'Fundador' })).toBe('Fundador')
        expect(await autor({})).toBe('CJ ENM')
    })

    it('história e galeria só com dados', async () => {
        const vazio = await montar()
        expect(secao(vazio.container, 'historia')).toBeNull()
        expect(secao(vazio.container, 'galeria')).toBeNull()
        expect(secao(vazio.container, 'citacao')).toBeNull()
        vazio.unmount()
        configurar(empresa({}, { milestones: ['1995|Fundação'], gallery_urls: ['https://img.test/g.jpg'] }))
        const { container } = await montar()
        expect(container.querySelector('[data-timeline]')).not.toBeNull()
        expect(container.querySelector('[data-galeria]')).not.toBeNull()
    })

    it('conexões: grupo próprio ou outras marcas; autorreferência não conta', async () => {
        const tem = async (acf: Obj) => {
            configurar(empresa({}, acf))
            const r = await montar()
            const ok = secao(r.container, 'conexoes') !== null
            r.unmount()
            return ok
        }
        expect(await tem({ chaebol_group: 'CJ Group' })).toBe(true)
        expect(await tem({ global_brands: ['Tous Les Jours'] })).toBe(true)
        expect(await tem({ chaebol_group: 'cj enm', global_brands: ['CJ ENM'] })).toBe(false)
        expect(await tem({})).toBe(false)
    })

    it('link do hub do grupo só quando há mais de uma empresa nele', async () => {
        configurar(empresa({}, { chaebol_group: 'CJ Group' }), { irmas: 5 })
        const com = json((await montar()).container.querySelector('[data-conexoes]'))
        expect(com.groupHubHref).toContain('cj-group')
        cleanup()
        configurar(empresa({}, { chaebol_group: 'CJ Group' }), { irmas: 1 })
        expect(json((await montar()).container.querySelector('[data-conexoes]')).groupHubHref).toBeNull()
        expect(countCompaniesInChaebolGroup).toHaveBeenCalledWith('CJ Group')
    })

    it('sem grupo próprio não conta empresas do grupo', async () => {
        configurar(empresa({}, { chaebol_group: 'CJ ENM' }))
        await montar()
        expect(countCompaniesInChaebolGroup).not.toHaveBeenCalled()
    })
})

describe('CompanyDetail: barra lateral', () => {
    it('dados da empresa: fundador, CEO, grupo e status só se não for ativa', async () => {
        configurar(empresa({}, { founder: 'Lee', ceo: 'Kim', chaebol_group: 'CJ', status: 'acquired' }))
        const { container } = await montar()
        const aside = container.querySelector('aside')!
        for (const k of ['founder', 'ceo', 'group', 'status']) expect(aside.textContent).toContain(k)
        expect(aside.textContent).toContain('acquired')
        cleanup()
        configurar(empresa({}, { founder: 'Lee', status: 'active' }))
        expect((await montar()).container.querySelector('aside')!.textContent).not.toContain('status')
    })

    it('sem fundador, CEO ou grupo não há cartão de dados', async () => {
        const { container } = await montar()
        expect(container.querySelector('aside')!.textContent).not.toContain('fact')
    })

    it('curiosidades e data de atualização', async () => {
        configurar(empresa({}, { curiosidades: ['Uma', 'Duas'] }))
        const { container } = await montar()
        expect(container.querySelectorAll('aside li')).toHaveLength(2)
        expect(container.querySelector('aside')!.textContent).toContain('updatedOn')
    })

    it('conteúdo da ficha vai no corpo', async () => {
        expect((await montar()).container.querySelector('.wp-article-content')!.textContent).toBe('Texto longo')
    })
})

describe('CompanyDetail: loja, blog e relacionadas', () => {
    it('bloco de loja e blog só em pt e só com algum conteúdo', async () => {
        expect(secao((await montar()).container, 'loja-blog')).toBeNull()
        cleanup()
        configurar(empresa(), { posts: [{}] })
        const pt = await montar()
        expect(secao(pt.container, 'loja-blog')).not.toBeNull()
        pt.unmount()
        expect(secao((await montar('en')).container, 'loja-blog')).toBeNull()
    })

    it('relacionadas linkam a ficha, mostram setor e "na loja" só em pt', async () => {
        vi.mocked(buildVitrineMatcher).mockResolvedValue(((nomes: string[]) => nomes[0] === 'Rel 1') as never)
        configurar(empresa(), { rel: [relacionada(1, { industry: 'food' }), relacionada(2)] })
        vi.mocked(buildVitrineMatcher).mockResolvedValue(((nomes: string[]) => nomes[0] === 'Rel 1') as never)
        const pt = await montar()
        const sec = secao(pt.container, 'relacionadas')!
        expect(sec.querySelectorAll('a[href*="rel-"]')).toHaveLength(2)
        expect(sec.textContent).toContain('setor:food')
        expect(sec.textContent!.match(/inStore/g)).toHaveLength(1)
        pt.unmount()
        const en = await montar('en')
        expect(secao(en.container, 'relacionadas')!.textContent).not.toContain('inStore')
    })

    it('sem relacionadas a seção some', async () => {
        expect(secao((await montar()).container, 'relacionadas')).toBeNull()
    })
})

describe('CompanyDetail: JSON-LD', () => {
    it('breadcrumb com 3 níveis e organização com site e Instagram em sameAs', async () => {
        configurar(empresa({}, { website: 'https://cj.test', instagram: 'https://ig.test/cj', founded_year: 1995 }))
        const { container } = await montar()
        const [bc, org] = Array.from(container.querySelectorAll('[data-jsonld]')).map(s => JSON.parse(s.textContent!))
        expect(bc.itemListElement).toHaveLength(3)
        expect(org.url).toBe('https://cj.test')
        expect(org.sameAs).toEqual(['https://cj.test', 'https://ig.test/cj'])
    })

    it('sem site a organização usa a url da ficha', async () => {
        const { container } = await montar()
        const org = JSON.parse(container.querySelectorAll('[data-jsonld]')[1].textContent!)
        expect(org.url.startsWith(SITE_URL)).toBe(true)
        expect(org.url).toContain('cj-enm')
    })
})

describe('generateMetadata', () => {
    const meta = (locale?: 'en') => generateMetadata({ params: Promise.resolve({ slug: 'cj-enm', locale }) })

    it('empresa inexistente devolve vazio', async () => {
        vi.mocked(getCompanyBySlug).mockResolvedValue(null as never)
        expect(await meta()).toEqual({})
    })

    it('Rank Math tem prioridade no título e na descrição', async () => {
        configurar(empresa({ meta: { rank_math_title: ' Título RM ', rank_math_description: 'Desc RM' } }))
        const m = await meta()
        expect(m.title).toBe('Título RM')
        expect(m.description).toBe('Desc RM')
    })

    it('sem Rank Math: modelo com setor; com nome coreano que não repete o nome, usa o modelo coreano', async () => {
        configurar(empresa({}, { industry: 'media' }))
        expect(String((await meta()).title)).toContain('metaTitle~')
        expect(String((await meta()).title)).not.toContain('metaTitleKorean')
        configurar(empresa({}, { industry: 'media', name_korean: '씨제이' }))
        expect(String((await meta()).title)).toContain('metaTitleKorean')
        configurar(empresa({}, { industry: 'media', name_korean: 'cj enm Korea' }))
        expect(String((await meta()).title)).not.toContain('metaTitleKorean')
    })

    it('descrição: excerpt, depois fundação, depois modelo simples; setor padrão sem setor', async () => {
        configurar(empresa())
        expect(String((await meta()).description)).toContain('Conglomerado')
        configurar(empresa({ excerpt: { rendered: '' }, content: { rendered: '' } }, { founded_year: 1995 }))
        expect(String((await meta()).description)).toContain('metaDescriptionFounded')
        expect(String((await meta()).description)).toContain('defaultIndustry'.toLowerCase())
        configurar(empresa({ excerpt: { rendered: '' }, content: { rendered: '' } }))
        expect(String((await meta()).description)).toContain('metaDescription~')
    })

    it('sem tradução vira noindex com o conteúdo em português', async () => {
        configurar(empresa({}, { industry: 'media' }))
        // Só o locale en está sem tradução; a versão em pt (usada de volta) não recursa.
        vi.mocked(semTraducao).mockImplementation(((_: unknown, locale: string) => locale === 'en') as never)
        const m = await meta('en')
        expect(m.robots).toMatchObject({ index: false, follow: true })
        expect(m.title).toBeTruthy()
    })
})

describe('slugsPreGerados', () => {
    it('junta todas as páginas', async () => {
        vi.mocked(getCompanies)
            .mockResolvedValueOnce({ items: [{ slug: 'a' }], totalPages: 3 } as never)
            .mockResolvedValueOnce({ items: [{ slug: 'b' }] } as never)
            .mockResolvedValueOnce({ items: [{ slug: 'c' }] } as never)
        expect(await slugsPreGerados()).toEqual([{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }])
        expect(vi.mocked(getCompanies).mock.calls[1][0]).toMatchObject({ page: 2 })
    })

    it('falha do WordPress devolve lista vazia', async () => {
        vi.mocked(getCompanies).mockRejectedValue(new Error('wp'))
        expect(await slugsPreGerados()).toEqual([])
    })
})
