// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { AdsProvider, useAds } from './AdsProvider'

const settings = {
    enabled: true,
    client: 'ca-pub-1234567890123456',
    slots: { inline: '1', article_sidebar: '', post_suggestion: '', leaderboard: '', sticky: '' },
}

function Estado() {
    return <span data-testid="estado">{String(useAds().enabled)}</span>
}

function definirWebdriver(valor: boolean) {
    Object.defineProperty(navigator, 'webdriver', { configurable: true, get: () => valor })
}

describe('AdsProvider', () => {
    afterEach(() => definirWebdriver(false))

    it('mantém anúncios para navegador comum', () => {
        definirWebdriver(false)
        const { getByTestId } = render(<AdsProvider settings={settings}><Estado /></AdsProvider>)
        expect(getByTestId('estado').textContent).toBe('true')
    })

    it('desliga anúncios quando navigator.webdriver é true', () => {
        definirWebdriver(true)
        const { getByTestId } = render(<AdsProvider settings={settings}><Estado /></AdsProvider>)
        expect(getByTestId('estado').textContent).toBe('false')
    })
})
