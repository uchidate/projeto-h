import { describe, expect, it } from 'vitest'
import { linksDePaginacao, paginaDe, paginaInvalida, robotsDaListagem, urlDaListagem } from './index'

const ORIGEM = 'https://exemplo.test'

describe('paginaDe', () => {
    it.each([[undefined, 1], ['1', 1], ['3', 3], ['0', 1], ['-2', 1], ['abc', 1], ['', 1]])('%s → %s', (v, esperado) => {
        expect(paginaDe(v)).toBe(esperado)
    })
})

describe('urlDaListagem', () => {
    // Saídas idênticas às funções buildXUrl que cada página tinha.
    it('sem filtro é só o caminho', () => {
        expect(urlDaListagem('/artists', ['role', 'letter'], {}, ORIGEM)).toBe('https://exemplo.test/artists')
    })
    it('mantém a ordem das chaves, não a do objeto', () => {
        expect(urlDaListagem('/artists', ['role', 'affiliation', 'letter'], { letter: 'A', role: 'actor' }, ORIGEM))
            .toBe('https://exemplo.test/artists?role=actor&letter=A')
    })
    it('ignora chaves fora da lista (search não entra no canonical)', () => {
        expect(urlDaListagem('/artists', ['role'], { search: 'iu', role: 'singer' }, ORIGEM))
            .toBe('https://exemplo.test/artists?role=singer')
    })
    it('page vai por último e some na página 1', () => {
        expect(urlDaListagem('/groups', ['type'], { page: '2', type: 'girl_group' }, ORIGEM))
            .toBe('https://exemplo.test/groups?type=girl_group&page=2')
        expect(urlDaListagem('/groups', ['type'], { page: '1', type: 'girl_group' }, ORIGEM))
            .toBe('https://exemplo.test/groups?type=girl_group')
    })
    it('valor vazio não entra', () => {
        expect(urlDaListagem('/blog', ['category'], { category: '' }, ORIGEM)).toBe('https://exemplo.test/blog')
    })
})

describe('paginaInvalida', () => {
    it('só passa do fim; total 0 conta como 1 página', () => {
        expect(paginaInvalida(1, 0)).toBe(false)
        expect(paginaInvalida(2, 0)).toBe(true)
        expect(paginaInvalida(5, 5)).toBe(false)
        expect(paginaInvalida(6, 5)).toBe(true)
    })
})

describe('linksDePaginacao', () => {
    const urlDaPagina = (p: number) => `/x?page=${p}`
    it('meio: prev e next', () => {
        expect(linksDePaginacao({ page: 2, totalPages: 3, urlDaPagina })).toEqual({ prev: '/x?page=1', next: '/x?page=3' })
    })
    it('primeira: só next; última: só prev', () => {
        expect(linksDePaginacao({ page: 1, totalPages: 3, urlDaPagina })).toEqual({ next: '/x?page=2' })
        expect(linksDePaginacao({ page: 3, totalPages: 3, urlDaPagina })).toEqual({ prev: '/x?page=2' })
    })
    it('ativa:false desliga tudo', () => {
        expect(linksDePaginacao({ page: 2, totalPages: 3, urlDaPagina, ativa: false })).toEqual({})
    })
})

describe('robotsDaListagem', () => {
    it('noindex só quando pedido', () => {
        expect(robotsDaListagem(true)).toEqual({ robots: { index: false, follow: true } })
        expect(robotsDaListagem(false)).toEqual({})
    })
})
