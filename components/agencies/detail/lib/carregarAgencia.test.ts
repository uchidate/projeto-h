import { beforeEach, describe, expect, it, vi } from 'vitest'
import { carregarAgencia } from './carregarAgencia'

const m = vi.hoisted(() => ({
    getAgencyBySlug: vi.fn(), getAgencies: vi.fn(), getArtists: vi.fn(),
    getGroups: vi.fn(), getPosts: vi.fn(), produtos: vi.fn(),
}))
vi.mock('@/lib/wordpress/agencies', () => ({ getAgencyBySlug: m.getAgencyBySlug, getAgencies: m.getAgencies }))
vi.mock('@/lib/wordpress/artists', () => ({ getArtists: m.getArtists }))
vi.mock('@/lib/wordpress/groups', () => ({ getGroups: m.getGroups }))
vi.mock('@/lib/wordpress/posts', () => ({ getPosts: m.getPosts }))
vi.mock('@/lib/wordpress/store', () => ({ getStoreProductsByGroupId: m.produtos }))
vi.mock('@/lib/wordpress/store-ranking', () => ({ ordenarPrateleira: (itens: unknown[]) => itens }))
vi.mock('@/lib/agencies/preview', () => ({
    applyAgencyDirectoryManifestPreview: (x: unknown) => x,
    applyAgencyManifestPreview: async (x: unknown) => x,
    applyEntityAffiliationsManifestPreview: async (x: unknown) => x,
}))
vi.mock('next-intl/server', () => ({
    getTranslations: async () => (chave: string, v?: Record<string, unknown>) => (v ? `${chave} ${Object.values(v).join('/')}` : chave),
}))

const agencia = (extra: Record<string, unknown> = {}) => ({
    id: 10, slug: 'casa', title: { rendered: 'Casa' }, country: 'KR', acf: {}, ...extra,
})
const grupo = (id: number, acf: Record<string, unknown> = {}, foto?: string) => ({
    id, slug: `g${id}`, title: { rendered: `G${id}` }, featured_image_url: foto, acf: { agency: 10, ...acf },
})
const comGrupos = (...items: unknown[]) => m.getGroups.mockResolvedValue({ items })
const carregar = async (slug = 'casa') => (await carregarAgencia(slug))!

describe('carregarAgencia', () => {
    beforeEach(() => {
        m.getAgencyBySlug.mockReset().mockResolvedValue(agencia())
        for (const f of [m.getAgencies, m.getArtists, m.getGroups, m.getPosts]) f.mockReset().mockResolvedValue({ items: [] })
        m.produtos.mockReset().mockResolvedValue([])
    })

    it('devolve null quando a agência não existe, sem buscar o resto', async () => {
        m.getAgencyBySlug.mockResolvedValue(null)
        expect(await carregarAgencia('nada')).toBeNull()
        expect(m.getGroups).not.toHaveBeenCalled()
    })

    it('abre a página mesmo com o resto do WordPress fora', async () => {
        for (const f of [m.getAgencies, m.getArtists, m.getGroups, m.getPosts]) f.mockRejectedValue(new Error('x'))
        const v = await carregar()
        expect([v.allGroups, v.allArtists, v.relatedPosts]).toEqual([[], [], []])
        expect(v.navLinks.map(l => l.href)).toEqual(['#sobre', '#faq'])
        expect(v.faqItems).toHaveLength(1)
    })

    it('tira a origem do ano mais antigo e ignora marco sem ano válido', async () => {
        m.getAgencyBySlug.mockResolvedValue(agencia({
            milestones: ['1995|Fundação', '12|ruim', '2999|futuro', 'sem descrição|', '2010|Nome novo | com barra'],
            acf: { founded_year: 2010 },
        }))
        const v = await carregar()
        expect(v.originYear).toBe(1995)
        expect(v.milestones.at(-1)).toEqual({ year: '2010', desc: 'Nome novo | com barra' })
        expect(v.summaryFacts.map(f => f.value)).toContain('facts.trajectoryBoth 1995/2010')
    })

    it('só mostra CEO quando há data de verificação válida', async () => {
        m.getAgencyBySlug.mockResolvedValue(agencia({ acf: { ceo: 'Kim', leadership_updated_at: 'ontem' } }))
        expect((await carregar()).summaryFacts.map(f => f.label)).not.toContain('facts.ceo')
        m.getAgencyBySlug.mockResolvedValue(agencia({ acf: { ceo: 'Kim', leadership_updated_at: '2026-03-01' } }))
        expect((await carregar()).summaryFacts.map(f => f.label)).toContain('facts.ceo')
    })

    it('descarta grupo de outra agência', async () => {
        comGrupos(grupo(1), grupo(2, { agency: 99 }))
        expect((await carregar()).allGroups.map(g => g.id)).toEqual([1])
    })

    it('destaca 4 ativos, com foto antes, e separa os encerrados', async () => {
        comGrupos(grupo(1), grupo(2), grupo(3), grupo(4), grupo(5, {}, 'https://img.test/5.jpg'), grupo(6, { active: false }))
        const v = await carregar()
        expect(v.featuredGroups.map(g => g.id)).toEqual([5, 1, 2, 3])
        expect(v.inactiveGroups.map(g => g.id)).toEqual([6])
        expect(v.currentVisualImage?.src).toBe('https://img.test/5.jpg')
    })

    it('não perde nenhum grupo ativo no catálogo: por geração ou em "outros"', async () => {
        const destaques = [1, 2, 3, 4].map(n => grupo(n, { trending_score: 100 }))
        comGrupos(...destaques, grupo(5, { debut_date: '2015-10-20' }), grupo(6, { debut_date: '20130101' }), grupo(7), grupo(8, { debut_date: '1987-01-01' }))
        const v = await carregar()
        expect(v.groupsByGen.map(g => [g.id, g.items.map(i => i.id)])).toEqual([['g3', [6, 5]]])
        expect(v.groupsWithoutGeneration.map(g => g.id)).toEqual([7, 8])
    })

    it('usa clipes dos grupos quando não há vídeos escolhidos, no máximo 4', async () => {
        comGrupos(...[1, 2, 3, 4, 5].map(n => grupo(n, { mv_url: `https://youtu.be/${n}` })))
        expect((await carregar()).agencyVideos).toHaveLength(4)
        m.getAgencyBySlug.mockResolvedValue(agencia({ acf: { featured_videos: [{ title: 'A', url: 'u' }] } }))
        expect((await carregar()).agencyVideos).toEqual([{ title: 'A', url: 'u' }])
    })

    it('agrupa as fontes por site, a mais citada primeiro, e ignora endereço inválido', async () => {
        m.getAgencyBySlug.mockResolvedValue(agencia({
            acf: {
                key_metrics: [
                    { value: '1', label: 'a', source_url: 'https://um.test/x' },
                    { value: '2', label: 'b', source_url: 'https://www.dois.test/x' },
                    { value: '3', label: 'c', source_url: 'https://dois.test/y' },
                    { value: '4', label: 'd', source_url: '/relativa' },
                    { value: '', label: 'sem valor', source_url: 'https://fora.test' },
                ],
            },
        }))
        const v = await carregar()
        expect(v.sourcesByHost.map(s => [s.host, s.count])).toEqual([['dois.test', 2], ['um.test', 1]])
        expect(v.keyMetrics).toHaveLength(4)
    })

    it('não repete produto que aparece em dois grupos e limita a 8', async () => {
        comGrupos(grupo(1), grupo(2))
        m.produtos.mockImplementation(async (id: number) => Array.from({ length: 6 }, (_, i) => ({ id: id === 1 ? i : i + 3 })))
        expect((await carregar()).shopProducts.map(p => p.id)).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
    })

    it('trata as quatro grandes com selo e pergunta própria', async () => {
        const v = await carregar('hybe')
        expect(v.tierLabel).toBe('tierBig4')
        expect(v.faqItems.map(f => f.question)).toContain('faq.q4 Casa')
        expect((await carregar()).tierLabel).toBeNull()
    })
})
