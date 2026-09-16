// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { FAQSchema } from './FAQSchema'

describe('FAQSchema', () => {
    afterEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    it('não renderiza <script> quando não há mainEntity', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: () => Promise.resolve({ mainEntity: [] }) }))
        const { container } = render(<FAQSchema group="productions" />)
        await waitFor(() => expect(container.querySelector('script')).not.toBeInTheDocument())
    })

    it('renderiza <script type="application/ld+json"> com o schema retornado', async () => {
        const schema = { '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: 'O que é K-pop?' }] }
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: () => Promise.resolve(schema) }))
        const { container } = render(<FAQSchema group="k-pop" />)

        await waitFor(() => expect(container.querySelector('script')).toBeInTheDocument())
        const script = container.querySelector('script[type="application/ld+json"]')
        expect(script?.innerHTML).toContain('O que é K-pop?')
    })

    it('busca no endpoint com o group correto na querystring', async () => {
        const fetchMock = vi.fn().mockResolvedValue({ json: () => Promise.resolve({ mainEntity: [] }) })
        vi.stubGlobal('fetch', fetchMock)
        render(<FAQSchema group="artists" />)
        await waitFor(() => expect(fetchMock).toHaveBeenCalled())
        expect(fetchMock.mock.calls[0][0]).toContain('faq-schema?group=artists')
    })

    it('usa group="general" como default quando não especificado', async () => {
        const fetchMock = vi.fn().mockResolvedValue({ json: () => Promise.resolve({ mainEntity: [] }) })
        vi.stubGlobal('fetch', fetchMock)
        render(<FAQSchema />)
        await waitFor(() => expect(fetchMock).toHaveBeenCalled())
        expect(fetchMock.mock.calls[0][0]).toContain('group=general')
    })

    it('não quebra quando o fetch falha (erro tratado silenciosamente)', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
        vi.spyOn(console, 'error').mockImplementation(() => {})
        const { container } = render(<FAQSchema group="productions" />)
        await waitFor(() => expect(container).toBeEmptyDOMElement())
    })
})
