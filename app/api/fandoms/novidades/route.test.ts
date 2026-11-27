import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'

const m = vi.hoisted(() => ({ getPosts: vi.fn(), getFandomBySlug: vi.fn(), getArtistsByIds: vi.fn(), proximasDatas: vi.fn() }))
vi.mock('@/lib/wordpress/posts', () => ({ getPosts: m.getPosts }))
vi.mock('@/lib/wordpress/fandoms', () => ({ getFandomBySlug: m.getFandomBySlug }))
vi.mock('@/lib/wordpress/artists', () => ({ getArtistsByIds: m.getArtistsByIds }))
vi.mock('@/lib/fandoms/datas', () => ({ proximasDatas: m.proximasDatas }))

let ip = 0
const pedir = (query: string, de = `10.0.0.${++ip}`) =>
    GET(new NextRequest(`http://localhost/api/fandoms/novidades${query}`, { headers: { 'x-forwarded-for': de, 'cf-connecting-ip': de } }))

const post = (id: number, date: string) => ({ id, date, slug: `post-${id}`, title: { rendered: `<em>Post ${id}</em>` } })

const fandom = {
    groups: [
        { slug: 'g1', title: { rendered: 'G1' }, acf: { members: [1, 2], debut_date: '20200101', active: true } },
        { slug: 'g2', title: { rendered: 'G2' }, acf: { members: [2, 3], active: false } },
        { slug: 'g3', title: { rendered: 'G3' }, acf: {} },
        { slug: 'g4', title: { rendered: 'G4' }, acf: {} },
    ],
}

describe('GET /api/fandoms/novidades', () => {
    beforeEach(() => {
        m.getPosts.mockReset().mockResolvedValue({ items: [] })
        m.getFandomBySlug.mockReset().mockResolvedValue(null)
        m.getArtistsByIds.mockReset().mockResolvedValue([])
        m.proximasDatas.mockReset().mockReturnValue([])
    })

    it.each(['', '?torcida=A%20B', '?grupo=../x', `?torcida=${'a'.repeat(81)}`])('não consulta o WordPress com parâmetro inválido (%s)', async query => {
        const res = await pedir(query)
        expect(await res.json()).toEqual({ artigos: [], datas: [] })
        expect(m.getPosts).not.toHaveBeenCalled()
        expect(m.getFandomBySlug).not.toHaveBeenCalled()
    })

    it('por grupo devolve só os artigos, com cache público', async () => {
        m.getPosts.mockResolvedValue({ items: [post(1, '2026-01-01')] })
        const res = await pedir('?grupo=twice')
        expect(await res.json()).toEqual({ artigos: [{ slug: 'post-1', titulo: 'Post 1', foto: null, data: '2026-01-01' }], datas: [] })
        expect(res.headers.get('Cache-Control')).toContain('s-maxage=600')
        expect(m.getPosts.mock.calls[0][0]).toMatchObject({ mentionsSlug: 'twice', lang: undefined })
        expect(m.getArtistsByIds).not.toHaveBeenCalled()
    })

    it('por torcida olha até 3 grupos, sem repetir artigo, e fica com os 3 mais novos', async () => {
        m.getFandomBySlug.mockResolvedValue(fandom)
        m.getPosts.mockImplementation(async ({ mentionsSlug }: { mentionsSlug: string }) => ({
            items: mentionsSlug === 'g1'
                ? [post(1, '2026-01-01'), post(2, '2026-03-01')]
                : mentionsSlug === 'g2' ? [post(2, '2026-03-01'), post(3, '2026-02-01')] : [post(4, '2026-04-01')],
        }))
        const corpo = await (await pedir('?torcida=once')).json()
        expect(m.getPosts).toHaveBeenCalledTimes(3)
        expect(corpo.artigos.map((a: { slug: string }) => a.slug)).toEqual(['post-4', 'post-2', 'post-3'])
        expect(m.getArtistsByIds).toHaveBeenCalledWith([1, 2, 3])
    })

    it('manda estreia e aniversários para o cálculo de datas', async () => {
        m.getFandomBySlug.mockResolvedValue(fandom)
        m.getArtistsByIds.mockResolvedValue([{ title: { rendered: 'Ana' }, acf: { birth_date: '19990101', death_date: '20200101' } }])
        m.proximasDatas.mockReturnValue([{ rotulo: 'x' }])
        const corpo = await (await pedir('?torcida=once')).json()
        const [gruposDatas, pessoas] = m.proximasDatas.mock.calls[0]
        expect(gruposDatas[0]).toEqual({ nome: 'G1', data: '20200101', encerrado: false })
        expect(gruposDatas[1].encerrado).toBe(true)
        expect(pessoas).toEqual([{ nome: 'Ana', data: '19990101', encerrado: true }])
        expect(corpo.datas).toEqual([{ rotulo: 'x' }])
    })

    it('repassa o idioma só quando é um idioma ativo diferente do padrão', async () => {
        await pedir('?grupo=twice&lang=en')
        await pedir('?grupo=twice&lang=pt')
        await pedir('?grupo=twice&lang=zz')
        expect(m.getPosts.mock.calls.map(c => c[0].lang)).toEqual(['en', undefined, undefined])
    })

    it('segue com o que houver quando posts ou artistas falham', async () => {
        m.getFandomBySlug.mockResolvedValue(fandom)
        m.getPosts.mockRejectedValue(new Error('x'))
        m.getArtistsByIds.mockRejectedValue(new Error('x'))
        const res = await pedir('?torcida=once')
        expect(res.status).toBe(200)
        expect(m.proximasDatas.mock.calls[0][1]).toEqual([])
    })

    it('responde vazio e sem cache quando a torcida não pode ser lida', async () => {
        m.getFandomBySlug.mockRejectedValue(new Error('x'))
        const res = await pedir('?torcida=once')
        expect(await res.json()).toEqual({ artigos: [], datas: [] })
        expect(res.headers.get('Cache-Control')).toBeNull()
    })

    it('bloqueia o mesmo IP depois de 30 consultas por minuto', async () => {
        for (let i = 0; i < 30; i++) expect((await pedir('?grupo=twice', '203.0.113.9')).status).toBe(200)
        expect((await pedir('?grupo=twice', '203.0.113.9')).status).toBe(429)
        expect((await pedir('?grupo=twice', '203.0.113.10')).status).toBe(200)
    })
})
