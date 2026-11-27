// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, cleanup, render, screen, fireEvent } from '@testing-library/react'

vi.mock('next-intl', () => ({
    useTranslations: (ns: string) => (key: string, valores?: Record<string, string>) =>
        valores ? `${ns}.${key}~${JSON.stringify(valores)}` : `${ns}.${key}`,
}))

import { CompartilharFaixa } from './CompartilharFaixa'

const writeText = vi.fn()

function montar({ share, toque }: { share?: ReturnType<typeof vi.fn>; toque: boolean }) {
    if (share) Object.defineProperty(navigator, 'share', { value: share, configurable: true })
    window.matchMedia = vi.fn(() => ({ matches: toque }) as MediaQueryList)
    render(<CompartilharFaixa id="faixa-2" titulo="Spring Day" />)
}
const clicar = () => act(async () => { fireEvent.click(screen.getByRole('button')) })
const rotulo = () => screen.getByRole('button').textContent

describe('CompartilharFaixa', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        writeText.mockReset().mockResolvedValue(undefined)
        Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
        window.history.replaceState(null, '', '/blog/album?utm_source=x#outra')
    })
    afterEach(() => {
        cleanup()
        vi.useRealTimers()
        Reflect.deleteProperty(navigator, 'share')
    })

    it('o nome acessível leva o título da faixa', () => {
        montar({ toque: false })
        expect(screen.getByRole('button').getAttribute('aria-label')).toBe('client.share.copyTrack~{"title":"Spring Day"}')
    })

    it('copia o link da faixa sem a query nem a âncora anterior e avisa por 2 segundos', async () => {
        montar({ toque: false })
        await clicar()

        expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/blog/album#faixa-2`)
        expect(rotulo()).toBe('client.share.copied')
        act(() => { vi.advanceTimersByTime(2000) })
        expect(rotulo()).toBe('client.share.label')
    })

    it('no computador copia mesmo que o navegador saiba compartilhar', async () => {
        const share = vi.fn()
        montar({ share, toque: false })
        await clicar()

        expect(share).not.toHaveBeenCalled()
        expect(writeText).toHaveBeenCalledTimes(1)
    })

    it('no toque abre a folha nativa com o título e não copia', async () => {
        const share = vi.fn().mockResolvedValue(undefined)
        montar({ share, toque: true })
        await clicar()

        expect(share).toHaveBeenCalledWith({ title: 'Spring Day', url: `${window.location.origin}/blog/album#faixa-2` })
        expect(writeText).not.toHaveBeenCalled()
        expect(rotulo()).toBe('client.share.label')
    })

    it('cancelar a folha nativa não copia nem avisa', async () => {
        const share = vi.fn().mockRejectedValue(new DOMException('cancelado', 'AbortError'))
        montar({ share, toque: true })
        await clicar()

        expect(writeText).not.toHaveBeenCalled()
        expect(rotulo()).toBe('client.share.label')
    })

    it('área de transferência recusada não afirma que copiou', async () => {
        writeText.mockRejectedValue(new Error('sem permissão'))
        montar({ toque: false })
        await clicar()

        expect(rotulo()).toBe('client.share.label')
    })
})
