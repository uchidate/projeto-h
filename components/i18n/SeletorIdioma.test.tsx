// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'

vi.mock('next/navigation', () => ({ usePathname: () => '/groups/grupo' }))

const { SeletorIdioma } = await import('./SeletorIdioma')

function declarar(links: Array<[string, string]>) {
    for (const [lang, href] of links) {
        const el = document.createElement('link')
        el.rel = 'alternate'
        el.setAttribute('hreflang', lang)
        el.href = `https://www.example.com${href}`
        document.head.appendChild(el)
    }
}

async function renderizar() {
    vi.useFakeTimers()
    render(<SeletorIdioma />)
    await act(async () => { vi.advanceTimersByTime(1000) })
    vi.useRealTimers()
}

describe('SeletorIdioma', () => {
    afterEach(() => {
        cleanup()
        document.head.querySelectorAll('link[rel="alternate"]').forEach((el) => el.remove())
    })

    it('mostra PT e EN quando a pagina declara as duas versoes, com o atual sem link', async () => {
        declarar([['pt-BR', '/groups/grupo'], ['en', '/en/groups/grupo'], ['x-default', '/groups/grupo']])
        await renderizar()
        expect(screen.getByText('PT').tagName).toBe('SPAN')
        const en = screen.getByRole('link', { name: 'EN' })
        expect(en.getAttribute('href')).toBe('/en/groups/grupo')
        expect(en.getAttribute('hreflang')).toBe('en')
    })

    it('nao aparece quando a pagina nao tem traducao', async () => {
        declarar([['pt-BR', '/artists/x'], ['x-default', '/artists/x']])
        await renderizar()
        expect(screen.queryByText('EN')).toBeNull()
        expect(screen.queryByText('PT')).toBeNull()
    })
})
