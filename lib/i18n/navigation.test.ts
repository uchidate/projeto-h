// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { localizedNavigation, localizedFooterColumns } from './navigation'

const labels = { home: 'Home', productions: 'Productions', artists: 'Artists', groups: 'Groups', blog: 'Articles', guides: 'Guides', foods: 'Food', quiz: 'Quiz' }

const footer = { catalog: 'Catalog', explore: 'Explore', guides: 'Guides', about: 'About', agencies: 'Agencies', aboutUs: 'About HallyuHub', contact: 'Contact' }

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
        expect(localizedFooterColumns('pt', footer, labels)).toEqual([])
    })

    it('rodapé traduzido tem catálogo, explorar e sobre, só com rotas do idioma', () => {
        const colunas = localizedFooterColumns('en', footer, labels)
        expect(colunas.map(c => c.heading)).toEqual(['Catalog', 'Explore', 'About'])
        expect(localizedFooterColumns('en', footer, labels, [{ label: 'Korean Movies', href: '/en/guides/korean-movies' }]).map(c => c.heading)).toEqual(['Catalog', 'Guides', 'Explore', 'About'])
        expect(colunas.flatMap(c => c.links.map(l => l.href))).toEqual([
            '/en/productions', '/en/artists', '/en/groups', '/en/agencies',
            '/en/blog', '/en/guides', '/en/foods', '/en/quiz', '/en/about', '/en/contact',
        ])
    })
})
