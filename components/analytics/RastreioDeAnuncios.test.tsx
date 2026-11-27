// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

const { trackExperienciaAnuncios, trackVinheta, rota } = vi.hoisted(() => ({
    trackExperienciaAnuncios: vi.fn(),
    trackVinheta: vi.fn(),
    rota: { atual: '/blog/um-post' },
}))
vi.mock('@/lib/analytics', () => ({ trackExperienciaAnuncios, trackVinheta }))
vi.mock('next/navigation', () => ({ usePathname: () => rota.atual }))

import { RastreioDeAnuncios } from './RastreioDeAnuncios'

type EntradaCls = { hadRecentInput: boolean; startTime: number; value: number; sources?: Array<{ node?: Node | null }> }

/** PerformanceObserver de mentira: guarda o callback para o teste emitir deslocamentos. */
const observadores: Array<(lista: { getEntries: () => EntradaCls[] }) => void> = []
class POFalso {
    constructor(cb: (lista: { getEntries: () => EntradaCls[] }) => void) { observadores.push(cb) }
    observe() {}
    disconnect() {}
}
class POSemSuporte {
    observe() { throw new TypeError('layout-shift não suportado') }
    disconnect() {}
}

function definirVisibilidade(estado: 'visible' | 'hidden') {
    Object.defineProperty(document, 'visibilityState', { value: estado, configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
}

const ANUNCIO_PROPRIO = '<div data-ad-placement="meio"><ins class="adsbygoogle" data-ad-status="filled"></ins></div>'

describe('RastreioDeAnuncios — um evento page_ads por página', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.stubGlobal('PerformanceObserver', POFalso)
        observadores.length = 0
        trackExperienciaAnuncios.mockClear()
        trackVinheta.mockClear()
        rota.atual = '/blog/um-post'
        document.body.innerHTML = ''
        document.documentElement.removeAttribute('data-consent-pendente')
        window.location.hash = ''
        Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    })
    afterEach(() => {
        vi.useRealTimers()
        vi.unstubAllGlobals()
    })

    it('envia o resumo ao esconder a aba, com tipo da página e tempo visível', () => {
        document.body.innerHTML = ANUNCIO_PROPRIO
        render(<RastreioDeAnuncios />)
        vi.advanceTimersByTime(5_000)
        definirVisibilidade('hidden')
        expect(trackExperienciaAnuncios).toHaveBeenCalledOnce()
        expect(trackExperienciaAnuncios).toHaveBeenCalledWith(expect.objectContaining({
            proprios: 1, automaticos: 0, tipoPagina: 'artigo', segundos: 5, vinheta: false, clsMedido: true,
        }))
    })

    it('conta anúncio que o Google inseriu sozinho como automático', () => {
        document.body.innerHTML = '<ins class="adsbygoogle" data-ad-status="filled"></ins>'
        const { unmount } = render(<RastreioDeAnuncios />)
        vi.advanceTimersByTime(2_000)
        unmount()
        expect(trackExperienciaAnuncios).toHaveBeenCalledWith(expect.objectContaining({ proprios: 0, automaticos: 1 }))
    })

    it('ignora passagem rápida demais para ser leitura', () => {
        const { unmount } = render(<RastreioDeAnuncios />)
        vi.advanceTimersByTime(900)
        unmount()
        expect(trackExperienciaAnuncios).not.toHaveBeenCalled()
    })

    it('não envia duas vezes quando esconde a aba e depois sai da página', () => {
        const { unmount } = render(<RastreioDeAnuncios />)
        vi.advanceTimersByTime(3_000)
        definirVisibilidade('hidden')
        unmount()
        expect(trackExperienciaAnuncios).toHaveBeenCalledOnce()
    })

    // Aba esquecida aberta não é atenção.
    it('não conta o tempo com a aba escondida', () => {
        const { unmount } = render(<RastreioDeAnuncios />)
        vi.advanceTimersByTime(2_000)
        definirVisibilidade('hidden')
        expect(trackExperienciaAnuncios).toHaveBeenCalledWith(expect.objectContaining({ segundos: 2 }))
        trackExperienciaAnuncios.mockClear()
        vi.advanceTimersByTime(600_000)
        unmount()
        expect(trackExperienciaAnuncios).not.toHaveBeenCalled()
    })

    it('guarda o máximo de anúncios vistos, mesmo se o DOM esvaziar antes de sair', () => {
        document.body.innerHTML = ANUNCIO_PROPRIO + ANUNCIO_PROPRIO
        const { unmount } = render(<RastreioDeAnuncios />)
        vi.advanceTimersByTime(4_000) // amostragem a cada 4 s vê os dois
        document.body.innerHTML = ''
        vi.advanceTimersByTime(1_000)
        unmount()
        expect(trackExperienciaAnuncios).toHaveBeenCalledWith(expect.objectContaining({ proprios: 2 }))
    })

    it('registra a vinheta quando o Google põe #google_vignette no endereço', () => {
        render(<RastreioDeAnuncios />)
        expect(trackVinheta).not.toHaveBeenCalled()
        window.location.hash = '#google_vignette'
        window.dispatchEvent(new HashChangeEvent('hashchange'))
        window.dispatchEvent(new HashChangeEvent('hashchange'))
        expect(trackVinheta).toHaveBeenCalledOnce()
        expect(trackVinheta).toHaveBeenCalledWith('artigo')
    })

    it('marca o banner de consentimento aberto e se ainda estava aberto ao sair', () => {
        document.documentElement.setAttribute('data-consent-pendente', '')
        const { unmount } = render(<RastreioDeAnuncios />)
        vi.advanceTimersByTime(2_000)
        unmount()
        expect(trackExperienciaAnuncios).toHaveBeenCalledWith(expect.objectContaining({ bannerAberto: true, bannerAbertoAoSair: true }))
    })

    it('mede até onde a pessoa rolou', () => {
        Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, configurable: true })
        Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
        Object.defineProperty(window, 'scrollY', { value: 600, configurable: true })
        const { unmount } = render(<RastreioDeAnuncios />)
        window.dispatchEvent(new Event('scroll'))
        vi.advanceTimersByTime(2_000)
        unmount()
        expect(trackExperienciaAnuncios).toHaveBeenCalledWith(expect.objectContaining({ rolagemPct: 50 }))
    })

    it('separa o CLS por culpado e ignora o que veio de interação', () => {
        document.body.innerHTML = ANUNCIO_PROPRIO
        const ins = document.querySelector('ins') as Element
        const { unmount } = render(<RastreioDeAnuncios />)
        vi.advanceTimersByTime(2_000)
        observadores[0]({ getEntries: () => [
            { hadRecentInput: false, startTime: 100, value: 0.2, sources: [{ node: ins }] },
            { hadRecentInput: true, startTime: 110, value: 0.9, sources: [{ node: ins }] },
            { hadRecentInput: false, startTime: 120, value: 0.05, sources: [{ node: document.body }] },
        ] })
        unmount()
        expect(trackExperienciaAnuncios).toHaveBeenCalledWith(expect.objectContaining({
            cls: { anuncio: 0.2, loja: 0, outro: 0.05 },
        }))
    })

    it('sem suporte a layout-shift (Safari) manda clsMedido falso', () => {
        vi.stubGlobal('PerformanceObserver', POSemSuporte)
        const { unmount } = render(<RastreioDeAnuncios />)
        vi.advanceTimersByTime(2_000)
        unmount()
        expect(trackExperienciaAnuncios).toHaveBeenCalledWith(expect.objectContaining({ clsMedido: false }))
    })
})
