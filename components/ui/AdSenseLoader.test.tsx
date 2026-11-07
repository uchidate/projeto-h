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

// jsdom só cria evento com isTrusted=false: o gesto real é simulado pelo detail.
vi.mock('@/lib/gesto-confiavel', () => ({
    gestoConfiavel: (e: Event) => (e as CustomEvent).detail?.confiavel !== false,
}))

function gesto(tipo: string, confiavel = true) {
    window.dispatchEvent(new CustomEvent(tipo, { detail: { confiavel } }))
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
        gesto('touchstart')
        const script = document.querySelector('script#adsense-init, script[src*="adsbygoogle"]')
        expect(script).toHaveAttribute('src', expect.stringContaining('client=ca-pub-123'))
        expect(script).toHaveAttribute('crossorigin', 'anonymous')
        expect(script).not.toHaveAttribute('data-nscript')
    })

    // Robô que executa JS esperava o prazo de 800 ms e gerava impressão inválida.
    it('não carrega sozinho: sem gesto confiável o script não entra', () => {
        vi.stubEnv('NODE_ENV', 'test')
        vi.useFakeTimers()
        render(<AdsProvider settings={settings()}><AdSenseLoader /></AdsProvider>)
        vi.advanceTimersByTime(10_000)
        gesto('pointerdown', false)
        window.dispatchEvent(new Event('scroll'))
        expect(document.querySelector('script[src*="adsbygoogle"]')).toBeNull()
        vi.useRealTimers()
    })

    it('o movimento do mouse confiável libera o script, sem exigir clique', () => {
        vi.stubEnv('NODE_ENV', 'test')
        render(<AdsProvider settings={settings()}><AdSenseLoader /></AdsProvider>)
        gesto('pointermove')
        expect(document.getElementById('adsense-init')).not.toBeNull()
    })

    it('movimento do mouse disparado por script não libera', () => {
        vi.stubEnv('NODE_ENV', 'test')
        render(<AdsProvider settings={settings()}><AdSenseLoader /></AdsProvider>)
        gesto('pointermove', false)
        expect(document.getElementById('adsense-init')).toBeNull()
    })

    it('injeta uma única vez mesmo com vários sinais', () => {
        vi.stubEnv('NODE_ENV', 'test')
        render(<AdsProvider settings={settings()}><AdSenseLoader /></AdsProvider>)
        gesto('wheel')
        gesto('keydown')
        expect(document.querySelectorAll('script[src*="adsbygoogle"]')).toHaveLength(1)
    })

    it('reutiliza um snippet preexistente do Site Kit sem duplicar código', () => {
        vi.stubEnv('NODE_ENV', 'test')
        const siteKit = document.createElement('script')
        siteKit.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-123&host=ca-host-pub-sitekit'
        document.head.appendChild(siteKit)

        render(<AdsProvider settings={settings()}><AdSenseLoader /></AdsProvider>)
        gesto('keydown')

        expect(document.querySelectorAll('script[src*="adsbygoogle"]')).toHaveLength(1)
    })

    it('espera a decisão do banner de consentimento antes de injetar', async () => {
        vi.stubEnv('NODE_ENV', 'test')
        vi.resetModules()
        let estado: 'perguntar' | 'oculto' = 'perguntar'
        let avisar = () => {}
        vi.doMock('@/lib/consent', () => ({
            getBannerState: () => estado,
            subscribeBanner: (cb: () => void) => { avisar = cb; return () => {} },
        }))
        const { AdSenseLoader: Loader } = await import('./AdSenseLoader')
        const { AdsProvider: Provider } = await import('@/components/providers/AdsProvider')
        render(<Provider settings={settings()}><Loader /></Provider>)
        gesto('keydown')
        expect(document.querySelector('script[src*="adsbygoogle"]')).toBeNull()
        estado = 'oculto'
        avisar()
        expect(document.querySelector('script[src*="adsbygoogle"]')).not.toBeNull()
        vi.doUnmock('@/lib/consent')
    })
})
