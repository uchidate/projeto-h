import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getMencoesNoAcervo } from './mentions'

const buscar = vi.hoisted(() => vi.fn())
vi.mock('./client', async importOriginal => ({
    ...(await importOriginal<typeof import('./client')>()),
    wpBuscarOpcional: buscar,
}))

const item = (slug: string, title: string, content = '') => ({
    id: slug.length,
    slug,
    title: { rendered: title },
    content: { rendered: content },
    featured_image_url: `https://img.test/${slug}.jpg`,
})

const tipoDe = (url: string) => url.split('?')[0].split('/').pop() as string

describe('getMencoesNoAcervo', () => {
    // Com chaves: o que o beforeEach devolve o Vitest chama como limpeza.
    beforeEach(() => {
        buscar.mockReset().mockResolvedValue([])
    })

    it('não busca nome com menos de 3 letras', async () => {
        expect(await getMencoesNoAcervo('  IU ')).toEqual([])
        expect(buscar).not.toHaveBeenCalled()
    })

    it('só devolve o que cita o nome no título ou no texto, sem ligar para acento', async () => {
        buscar.mockResolvedValue([
            item('no-titulo', 'Pokémon na Coreia'),
            item('no-texto', 'Lanche', '<p>Parceria com <strong>pokemon</strong></p>'),
            item('sem-relacao', 'Outra ficha', '<a href="/pokemon">veja</a>'),
        ])
        const r = await getMencoesNoAcervo('Pokémon', 5, { tipos: ['food'] })
        expect(r.map(m => m.href)).toEqual(['/comidas/no-titulo', '/comidas/no-texto'])
        expect(r[0]).toEqual({ type: 'food', href: '/comidas/no-titulo', title: 'Pokémon na Coreia', image: 'https://img.test/no-titulo.jpg' })
    })

    it('exclui a própria ficha só no tipo dela', async () => {
        buscar.mockResolvedValue([item('nongshim', 'Nongshim')])
        const r = await getMencoesNoAcervo('Nongshim', 3, { tipos: ['company', 'food'], excluirCpt: 'company', excluirSlug: 'nongshim' })
        expect(r.map(m => m.href)).toEqual(['/comidas/nongshim'])
    })

    it('corta no limite por tipo e pede margem à busca do WordPress', async () => {
        buscar.mockResolvedValue([1, 2, 3, 4].map(n => item(`a-${n}`, `Samsung ${n}`)))
        const r = await getMencoesNoAcervo('Samsung', 2, { tipos: ['artist'] })
        expect(r).toHaveLength(2)
        expect(buscar.mock.calls[0][0]).toContain('per_page=8')
    })

    it('consulta os cinco tipos do acervo e mantém os demais quando um falha', async () => {
        buscar.mockImplementation(async (url: string) => {
            if (tipoDe(url) === 'group') throw new Error('fora do ar')
            return [item(`x-${tipoDe(url)}`, 'Samsung')]
        })
        const r = await getMencoesNoAcervo('Samsung')
        expect(buscar).toHaveBeenCalledTimes(5)
        expect(r.map(m => m.href)).toEqual([
            '/artists/x-artist', '/productions/x-production', '/comidas/x-food', '/empresas/x-company',
        ])
    })

    it('devolve lista vazia quando a resposta vem malformada', async () => {
        buscar.mockResolvedValue({ code: 'rest_error' })
        expect(await getMencoesNoAcervo('Samsung')).toEqual([])
    })
})
