// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { localizedNavigation, localizedFooterColumns } from './navigation'

const labels = { home: 'Home', productions: 'Productions', artists: 'Artists', groups: 'Groups', blog: 'Articles', guides: 'Guides', foods: 'Food', quiz: 'Quiz', calendar: 'Calendar', culture: 'Culture', fandoms: 'Fandoms' }

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
            { label: 'Culture', href: '/en/korean-culture-101' },
            { label: 'Food', href: '/en/foods' },
            { label: 'Fandoms', href: '/en/fandoms' },
            { label: 'Calendar', href: '/en/calendar' },
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
            '/en/blog', '/en/guides', '/en/korean-culture-101', '/en/foods', '/en/fandoms', '/en/calendar', '/en/quiz', '/en/about', '/en/contact',
        ])
    })
})

describe('menu x manifesto de rotas', () => {
    it('todo item do menu em inglês aponta para rota que existe no idioma (pronta ou parcial), nunca só-PT', async () => {
        const { NAV_ITEMS } = await import('./navigation')
        const { ROUTES } = await import('./routes')
        const { MANIFESTO_DE_ROTAS } = await import('./route-manifest')
        for (const item of NAV_ITEMS) {
            const entrada = MANIFESTO_DE_ROTAS[ROUTES[item.route].pt]
            expect(entrada, `${item.route} sem entrada no manifesto`).toBeDefined()
            expect(['pronta', 'parcial']).toContain(entrada.estado)
        }
    })
})
