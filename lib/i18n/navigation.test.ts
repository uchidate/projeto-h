// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { localizedNavigation, localizedFooterColumns } from './navigation'

const labels = { home: 'Home', productions: 'Productions', artists: 'Artists', groups: 'Groups', blog: 'Articles', guides: 'Guides', foods: 'Food', quiz: 'Quiz' }

describe('navegação por idioma', () => {
    it('em inglês, lista só rotas que existem no idioma, com prefixo', () => {
        expect(localizedNavigation('en', labels)).toEqual([
            { label: 'Home', href: '/en' },
            { label: 'Productions', href: '/en/productions' },
            { label: 'Artists', href: '/en/artists' },
            { label: 'Groups', href: '/en/groups' },
            { label: 'Articles', href: '/en/blog' },
            { label: 'Guides', href: '/en/guides' },
            { label: 'Food', href: '/en/foods' },
            { label: 'Quiz', href: '/en/quiz' },
        ])
    })

    it('em português devolve vazio — o menu vem do WordPress', () => {
        expect(localizedNavigation('pt', labels)).toEqual([])
        expect(localizedFooterColumns('pt', 'Catálogo', labels)).toEqual([])
    })

    it('rodapé traduzido tem uma coluna com os mesmos destinos', () => {
        expect(localizedFooterColumns('en', 'Catalog', labels)).toEqual([
            { heading: 'Catalog', links: localizedNavigation('en', labels) },
        ])
    })
})
