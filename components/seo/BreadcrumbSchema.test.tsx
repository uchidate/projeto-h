// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { BreadcrumbSchema } from './BreadcrumbSchema'

vi.mock('next/navigation', () => ({ usePathname: () => '/artists/bts' }))

describe('BreadcrumbSchema', () => {
    afterEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    it('não renderiza <script> antes do fetch resolver', () => {
        vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
        const { container } = render(<BreadcrumbSchema />)
        expect(container).toBeEmptyDOMElement()
    })

    it('renderiza <script type="application/ld+json"> com o schema retornado', async () => {
        const schema = { '@type': 'BreadcrumbList', itemListElement: [{ name: 'Artistas' }] }
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: () => Promise.resolve(schema) }))
        const { container } = render(<BreadcrumbSchema />)

        await waitFor(() => expect(container.querySelector('script')).toBeInTheDocument())
        expect(container.querySelector('script')?.innerHTML).toContain('BreadcrumbList')
    })

    it('busca no endpoint com o pathname atual', async () => {
        const fetchMock = vi.fn().mockResolvedValue({ json: () => Promise.resolve({ '@type': 'BreadcrumbList' }) })
        vi.stubGlobal('fetch', fetchMock)
        render(<BreadcrumbSchema />)
        await waitFor(() => expect(fetchMock).toHaveBeenCalled())
        expect(fetchMock.mock.calls[0][0]).toContain('breadcrumb-schema?path=/artists/bts')
    })

    it('não quebra quando o fetch falha (erro tratado silenciosamente)', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
        vi.spyOn(console, 'error').mockImplementation(() => {})
        const { container } = render(<BreadcrumbSchema />)
        await waitFor(() => expect(container).toBeEmptyDOMElement())
    })
})
