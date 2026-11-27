import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { getConexoes } = vi.hoisted(() => ({ getConexoes: vi.fn() }))
vi.mock('@/lib/mapa/conexoes', () => ({ getConexoes }))

import titulos from '@/lib/i18n/titulos.json'
import { GET } from './route'

// Uma obra real do mapa de títulos cujo nome em inglês difere do slug.
const [slug, nomes] = Object.entries(titulos.production as Record<string, { en?: string }>).find(([, n]) => n.en)!

const dados = () => ({
    centro: { label: 'Título em português', img: null, href: `/productions/${slug}`, tipo: 'production' },
    nos: [
        { href: `/productions/${slug}`, label: 'Outro título', img: null, tipo: 'obra' },
        { href: `/artists/${slug}`, label: 'Pessoa', img: null, tipo: 'artista' },
    ],
})
let ip = 0
const pedir = (query: string, de = `10.0.0.${++ip}`) =>
    GET(new NextRequest(`https://site.test/api/conexoes?${query}`, { headers: { 'x-forwarded-for': de, 'cf-connecting-ip': de } }))

beforeEach(() => { getConexoes.mockReset().mockImplementation(async () => dados()) })

describe('GET /api/conexoes', () => {
    it('recusa tipo ou slug inválido sem consultar o WordPress', async () => {
        for (const q of ['', 'tipo=agency&slug=x', 'tipo=artist', 'tipo=artist&slug=../x', 'tipo=artist&slug=A']) {
            expect((await pedir(q)).status).toBe(400)
        }
        expect(getConexoes).not.toHaveBeenCalled()
    })

    it('devolve o mapa em português com cache', async () => {
        const r = await pedir(`tipo=production&slug=${slug}`)
        expect(r.status).toBe(200)
        expect(r.headers.get('Cache-Control')).toContain('s-maxage=600')
        expect(await r.json()).toEqual(dados())
    })

    it('em outro idioma troca o título das obras e mantém o nome das pessoas', async () => {
        const corpo = await (await pedir(`tipo=production&slug=${slug}&idioma=en`)).json()
        expect(corpo.centro.label).toBe(nomes.en)
        expect(corpo.nos.map((n: { label: string }) => n.label)).toEqual([nomes.en, 'Pessoa'])
    })

    it('idioma desconhecido fica em português', async () => {
        const corpo = await (await pedir(`tipo=production&slug=${slug}&idioma=xx`)).json()
        expect(corpo).toEqual(dados())
    })

    it('404 para entidade inexistente e 502 quando o WordPress falha', async () => {
        getConexoes.mockResolvedValueOnce(null)
        expect((await pedir('tipo=artist&slug=ninguem')).status).toBe(404)
        getConexoes.mockRejectedValueOnce(new Error('fora'))
        expect((await pedir('tipo=artist&slug=alguem')).status).toBe(502)
    })

    it('limita a 30 consultas por minuto por endereço', async () => {
        for (let i = 0; i < 30; i++) expect((await pedir('tipo=artist&slug=x', '10.9.9.9')).status).toBe(200)
        expect((await pedir('tipo=artist&slug=x', '10.9.9.9')).status).toBe(429)
    })
})
