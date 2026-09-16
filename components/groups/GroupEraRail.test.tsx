// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { GroupEraRail } from './GroupEraRail'

const capitulos = [
    { period: '2025', title: 'Gnarly', description: 'x', source_url: 'https://example.com/a', visual_url: '/a.jpg' },
    { period: '2025', title: 'Beautiful Chaos', description: 'y', source_url: 'https://example.com/b', visual_url: '/b.jpg' },
]

afterEach(() => vi.restoreAllMocks())

describe('GroupEraRail', () => {
    // Regressão: a key era só o período, então dois capítulos do mesmo ano
    // colidiam e o React avisava sobre children com a mesma chave. Vários
    // perfis publicados têm dois capítulos no mesmo ano.
    it('não gera key duplicada quando dois capítulos dividem o período', () => {
        const erro = vi.spyOn(console, 'error').mockImplementation(() => {})
        render(<GroupEraRail chapters={capitulos} accent="#fff" groupName="Teste" />)
        const avisos = erro.mock.calls.map(c => String(c[0])).filter(m => m.includes('same key'))
        expect(avisos).toEqual([])
    })

    it('renderiza um item por capítulo com imagem', () => {
        const { container } = render(<GroupEraRail chapters={capitulos} accent="#fff" groupName="Teste" />)
        expect(container.querySelectorAll('a[href^="#era-"]').length).toBe(2)
    })
})
