import { describe, it, expect } from 'vitest'
import { separarCulturaEGastronomia } from './site-settings'

const antigo = [
    { label: 'Notícias', href: '/blog' },
    { label: 'Cultura e Gastronomia', href: '/cultura-coreana-101' },
    { label: 'Fandoms', href: '/fandoms' },
]

describe('separarCulturaEGastronomia', () => {
    it('divide o item antigo em Cultura e Gastronomia, na mesma posição', () => {
        expect(separarCulturaEGastronomia(antigo).map(l => [l.label, l.href])).toEqual([
            ['Notícias', '/blog'],
            ['Cultura', '/cultura-coreana-101'],
            ['Gastronomia', '/comidas'],
            ['Fandoms', '/fandoms'],
        ])
    })
    it('não mexe em menu que já tem Gastronomia', () => {
        const novo = [{ label: 'Cultura', href: '/cultura-coreana-101' }, { label: 'Gastronomia', href: '/comidas' }]
        expect(separarCulturaEGastronomia(novo)).toEqual(novo)
    })
    it('não mexe em menu sem o item antigo', () => {
        const outro = [{ label: 'Cultura', href: '/cultura-coreana-101' }]
        expect(separarCulturaEGastronomia(outro)).toEqual(outro)
    })
})
