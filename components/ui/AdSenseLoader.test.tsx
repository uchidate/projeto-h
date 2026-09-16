// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { AdSenseLoader } from './AdSenseLoader'
import { AdsProvider } from '@/components/providers/AdsProvider'
import type { MonetizationSettings } from '@/lib/wordpress/monetization'

function settings(overrides: Partial<MonetizationSettings> = {}): MonetizationSettings {
    return {
        enabled: true,
        client: 'ca-pub-123',
        slots: { inline: '', article_sidebar: '', post_suggestion: '', leaderboard: '', sticky: '' },
        ...overrides,
    }
}

describe('AdSenseLoader', () => {
    afterEach(() => {
        vi.unstubAllEnvs()
        document.querySelectorAll('script[src*="adsbygoogle"]').forEach(script => script.remove())
    })

    it('não renderiza nada quando ads.enabled é false', () => {
        const { container } = render(<AdsProvider settings={settings({ enabled: false })}><AdSenseLoader /></AdsProvider>)
        expect(container).toBeEmptyDOMElement()
    })

    it('não renderiza nada sem client configurado', () => {
        const { container } = render(<AdsProvider settings={settings({ client: '' })}><AdSenseLoader /></AdsProvider>)
        expect(container).toBeEmptyDOMElement()
    })

    it('não renderiza nada em NODE_ENV=development', () => {
        vi.stubEnv('NODE_ENV', 'development')
        const { container } = render(<AdsProvider settings={settings()}><AdSenseLoader /></AdsProvider>)
        expect(container).toBeEmptyDOMElement()
    })

    // O script pesa ~275 KB e, injetado junto com a hidratação, disputa banda
    // com a imagem do LCP — custava 27 pontos de Lighthouse. A espera é curta
    // (800 ms) para não levantar dúvida sobre entrega de anúncio.
    it('não injeta o script no mesmo instante da montagem', () => {
        vi.stubEnv('NODE_ENV', 'test')
        render(<AdsProvider settings={settings()}><AdSenseLoader /></AdsProvider>)
        expect(document.querySelector('script[src*="adsbygoogle"]')).toBeNull()
    })

    it('injeta com o client correto ao primeiro sinal de uso', () => {
        vi.stubEnv('NODE_ENV', 'test')
        render(<AdsProvider settings={settings()}><AdSenseLoader /></AdsProvider>)
        window.dispatchEvent(new Event('scroll'))
        const script = document.querySelector('script#adsense-init, script[src*="adsbygoogle"]')
        expect(script).toHaveAttribute('src', expect.stringContaining('client=ca-pub-123'))
        expect(script).toHaveAttribute('crossorigin', 'anonymous')
        expect(script).not.toHaveAttribute('data-nscript')
    })

    it('carrega sozinho em menos de 1 s, sem nenhuma interação', () => {
        vi.stubEnv('NODE_ENV', 'test')
        vi.useFakeTimers()
        render(<AdsProvider settings={settings()}><AdSenseLoader /></AdsProvider>)
        vi.advanceTimersByTime(900)
        expect(document.querySelector('script[src*="adsbygoogle"]')).not.toBeNull()
        vi.useRealTimers()
    })

    it('injeta uma única vez mesmo com vários sinais', () => {
        vi.stubEnv('NODE_ENV', 'test')
        render(<AdsProvider settings={settings()}><AdSenseLoader /></AdsProvider>)
        window.dispatchEvent(new Event('scroll'))
        window.dispatchEvent(new Event('keydown'))
        expect(document.querySelectorAll('script[src*="adsbygoogle"]')).toHaveLength(1)
    })

    it('reutiliza um snippet preexistente do Site Kit sem duplicar código', () => {
        vi.stubEnv('NODE_ENV', 'test')
        const siteKit = document.createElement('script')
        siteKit.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-123&host=ca-host-pub-sitekit'
        document.head.appendChild(siteKit)

        render(<AdsProvider settings={settings()}><AdSenseLoader /></AdsProvider>)
        window.dispatchEvent(new Event('scroll'))

        expect(document.querySelectorAll('script[src*="adsbygoogle"]')).toHaveLength(1)
    })
})
