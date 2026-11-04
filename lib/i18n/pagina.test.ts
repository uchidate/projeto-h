import { beforeEach, describe, expect, it, vi } from 'vitest'

const notFound = vi.hoisted(() => vi.fn(() => { throw new Error('NEXT_NOT_FOUND') }))
const setPageLocale = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ notFound }))
vi.mock('./request-locale', () => ({ setPageLocale }))

import { entrarNaPagina, idiomaValido } from './pagina'

beforeEach(() => { notFound.mockClear(); setPageLocale.mockClear() })

describe('idiomaValido', () => {
    it('aceita o inglês e recusa idioma inexistente', () => {
        expect(idiomaValido('en')).toBe(true)
        expect(idiomaValido('xx')).toBe(false)
        expect(idiomaValido('')).toBe(false)
    })
    it('recusa o português, salvo em página que já migrou', () => {
        expect(idiomaValido('pt')).toBe(false)
        expect(idiomaValido('pt', { servePt: true })).toBe(true)
    })
})

describe('entrarNaPagina', () => {
    it('fixa o idioma quando vale', () => {
        entrarNaPagina('en')
        expect(setPageLocale).toHaveBeenCalledWith('en')
        expect(notFound).not.toHaveBeenCalled()
    })
    it('dá 404 sem fixar idioma quando não vale', () => {
        expect(() => entrarNaPagina('pt')).toThrow('NEXT_NOT_FOUND')
        expect(() => entrarNaPagina('xx', { servePt: true })).toThrow('NEXT_NOT_FOUND')
        expect(setPageLocale).not.toHaveBeenCalled()
    })
    it('fixa o português em página migrada', () => {
        entrarNaPagina('pt', { servePt: true })
        expect(setPageLocale).toHaveBeenCalledWith('pt')
    })
})
