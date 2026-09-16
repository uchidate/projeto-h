// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { SEOProvider } from './SEOProvider'

let pathnameValue = '/'
vi.mock('next/navigation', () => ({ usePathname: () => pathnameValue }))

describe('SEOProvider', () => {
    afterEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    it('não busca nada em rotas de listagem (menos de 2 segmentos)', () => {
        pathnameValue = '/productions'
        const fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
        render(<SEOProvider />)
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('não busca nada na home', () => {
        pathnameValue = '/'
        const fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
        render(<SEOProvider />)
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('extrai type (singular) e slug do pathname em páginas de detalhe', async () => {
        pathnameValue = '/productions/the-heirs'
        const fetchMock = vi.fn().mockResolvedValue({ json: () => Promise.resolve({}) })
        vi.stubGlobal('fetch', fetchMock)
        render(<SEOProvider />)
        await waitFor(() => expect(fetchMock).toHaveBeenCalled())
        const calledUrl = fetchMock.mock.calls[0][0] as string
        expect(calledUrl).toContain('type=production')
        expect(calledUrl).toContain('slug=the-heirs')
    })

    it('não renderiza nada antes do fetch resolver', () => {
        pathnameValue = '/artists/bts'
        vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
        const { container } = render(<SEOProvider />)
        expect(container).toBeEmptyDOMElement()
    })

    it('renderiza apenas os schemas presentes na resposta (breadcrumb sem faqs)', async () => {
        pathnameValue = '/artists/bts'
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            json: () => Promise.resolve({ breadcrumb: { '@type': 'BreadcrumbList' } }),
        }))
        const { container } = render(<SEOProvider />)
        await waitFor(() => expect(container.querySelectorAll('script').length).toBe(1))
        expect(container.querySelector('script')?.innerHTML).toContain('BreadcrumbList')
    })

    it('renderiza os 3 schemas quando todos presentes na resposta', async () => {
        pathnameValue = '/artists/bts'
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            json: () => Promise.resolve({
                breadcrumb: { '@type': 'BreadcrumbList' },
                faqs: { '@type': 'FAQPage' },
                organizationSchema: { '@type': 'Organization' },
            }),
        }))
        const { container } = render(<SEOProvider />)
        await waitFor(() => expect(container.querySelectorAll('script').length).toBe(3))
    })

    it('não quebra quando o fetch falha', async () => {
        pathnameValue = '/artists/bts'
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
        vi.spyOn(console, 'error').mockImplementation(() => {})
        const { container } = render(<SEOProvider />)
        await waitFor(() => expect(container).toBeEmptyDOMElement())
    })
})
