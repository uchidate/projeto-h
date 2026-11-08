import { beforeEach, describe, expect, it, vi } from 'vitest'

const { notFound } = vi.hoisted(() => ({ notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND') }) }))
vi.mock('next/navigation', () => ({ notFound }))
vi.mock('./request-locale', () => ({ setPageLocale: vi.fn() }))

import { paginaLocalizada } from './pagina-localizada'

const params = <T extends object = object>(locale: string, resto: T = {} as T) => Promise.resolve({ locale, ...resto })

describe('paginaLocalizada', () => {
    beforeEach(() => { notFound.mockClear() })

    it('metadata: idioma inválido devolve {} sem chamar a página', async () => {
        const metadata = vi.fn(() => ({ title: 'x' }))
        const p = paginaLocalizada({ metadata, render: () => null })
        expect(await p.generateMetadata({ params: params('xx') })).toEqual({})
        expect(metadata).not.toHaveBeenCalled()
        expect(await p.generateMetadata({ params: params('es') })).toEqual({ title: 'x' })
    })

    it('render: idioma inválido dá 404; válido recebe o contexto com o resto dos params', async () => {
        const render = vi.fn(({ locale, params }: { locale: string; params: { slug: string } }) => `${locale}:${params.slug}`)
        const p = paginaLocalizada<{ slug: string }>({ render })
        await expect(p.Page({ params: params('xx', { slug: 'iu' }) })).rejects.toThrow('NEXT_NOT_FOUND')
        expect(await p.Page({ params: params('en', { slug: 'iu' }) })).toBe('en:iu')
    })

    it('só português: outros idiomas dão {} nos metadados e 404 na página', async () => {
        const p = paginaLocalizada({ soPortugues: true, metadata: () => ({ title: 'loja' }), render: () => 'ok' })
        expect(await p.generateMetadata({ params: params('pt') })).toEqual({ title: 'loja' })
        expect(await p.generateMetadata({ params: params('en') })).toEqual({})
        expect(await p.Page({ params: params('pt') })).toBe('ok')
        await expect(p.Page({ params: params('en') })).rejects.toThrow('NEXT_NOT_FOUND')
    })

    it('searchParams só é repassado quando a página pede', async () => {
        const sp = Promise.resolve({ q: 'iu' })
        const sem = paginaLocalizada({ render: ({ searchParams }) => String(searchParams) })
        expect(await sem.Page({ params: params('pt'), searchParams: sp as never })).toBe('undefined')
        const com = paginaLocalizada<object, typeof sp>({ comSearchParams: true, render: ({ searchParams }) => (searchParams === sp ? 'mesma' : 'outra') })
        expect(await com.Page({ params: params('pt'), searchParams: sp })).toBe('mesma')
    })
})
