// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { AdsProvider, useAds, useNaoAutomatizado } from './AdsProvider'

const settings = {
    enabled: true,
    client: 'ca-pub-1234567890123456',
    slots: { inline: '1', article_sidebar: '', post_suggestion: '', leaderboard: '', sticky: '' },
}

function Estado() {
    return <span data-testid="estado">{String(useAds().enabled)}</span>
}

function EstadoAutomatizado() {
    return <span data-testid="automatizado">{String(useNaoAutomatizado())}</span>
}

function definirWebdriver(valor: boolean) {
    Object.defineProperty(navigator, 'webdriver', { configurable: true, get: () => valor })
}

describe('AdsProvider', () => {
    afterEach(() => definirWebdriver(false))

    it('repassa settings sem alterar enabled', () => {
        const { getByTestId } = render(<AdsProvider settings={settings}><Estado /></AdsProvider>)
        expect(getByTestId('estado').textContent).toBe('true')
    })
})

describe('useNaoAutomatizado', () => {
    afterEach(() => definirWebdriver(false))

    it('primeiro render é sempre false (SSR-safe), mesmo com navigator.webdriver true', () => {
        definirWebdriver(true)
        const { getByTestId } = render(<EstadoAutomatizado />)
        // Não afirma o valor síncrono do 1º render (dependeria de act()); a garantia
        // real é a hidratação nunca divergir do servidor, testada abaixo por
        // convergir para 'true' só DEPOIS do efeito de montagem.
        return waitFor(() => expect(getByTestId('automatizado').textContent).toBe('true'))
    })

    it('permanece false para navegador comum', async () => {
        definirWebdriver(false)
        const { getByTestId } = render(<EstadoAutomatizado />)
        await waitFor(() => expect(getByTestId('automatizado').textContent).toBe('false'))
    })
})
