// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LanguageSwitcher, type LanguageLink } from './LanguageSwitcher'

const links = [
    { locale: 'en', htmlLang: 'en', name: 'English', href: '/en/x', prompt: 'Read this in English', open: 'Open' },
    { locale: 'ja', htmlLang: 'ja', name: '日本語', href: '/ja/x', prompt: '日本語で読む', open: '開く' },
] as unknown as LanguageLink[]

const navegador = (...idiomas: string[]) => vi.spyOn(navigator, 'languages', 'get').mockReturnValue(idiomas)
const montar = (extra: Partial<Parameters<typeof LanguageSwitcher>[0]> = {}) =>
    render(<LanguageSwitcher availableIn="Também disponível em" dismissLabel="Fechar" links={links} {...extra} />)

describe('LanguageSwitcher', () => {
    beforeEach(() => {
        localStorage.clear()
        navegador('pt-BR')
    })
    afterEach(() => {
        cleanup()
        vi.restoreAllMocks()
    })

    it('não desenha nada sem outras versões', () => {
        const { container } = montar({ links: [] })
        expect(container.innerHTML).toBe('')
    })

    it('lista as versões com o idioma de destino', () => {
        montar()
        const nav = screen.getByRole('navigation', { name: 'Também disponível em' })
        expect(nav).toBeTruthy()
        const en = screen.getByRole('link', { name: 'English' })
        expect([en.getAttribute('href'), en.getAttribute('hreflang'), en.getAttribute('lang')]).toEqual(['/en/x', 'en', 'en'])
        expect(screen.queryByRole('note')).toBeNull()
    })

    it('na faixa curta mostra siglas e guarda o nome no title', () => {
        montar({ curto: true })
        expect(screen.getByText('EN')).toBeTruthy()
        expect(screen.getByTitle('English').getAttribute('href')).toBe('/en/x')
    })

    it('convida no primeiro idioma do navegador que existir', () => {
        navegador('fr-FR', 'JA-jp', 'en-US')
        montar()
        expect(screen.getByRole('note').getAttribute('lang')).toBe('ja')
        expect(screen.getByRole('link').getAttribute('href')).toBe('/ja/x')
    })

    it('dispensado, volta à lista e não convida de novo', () => {
        navegador('en-US')
        montar()
        fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
        expect(screen.queryByRole('note')).toBeNull()
        cleanup()
        montar()
        expect(screen.queryByRole('note')).toBeNull()
        expect(screen.getByRole('navigation')).toBeTruthy()
    })

    it('com armazenamento bloqueado ainda convida e permite fechar', () => {
        navegador('en-US')
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('bloqueado') })
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('bloqueado') })
        montar()
        fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
        expect(screen.queryByRole('note')).toBeNull()
    })
})
