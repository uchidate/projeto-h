// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { trackQuizComplete, trackSearch, trackScrollDepth, trackBlogRead } from './analytics'

describe('envio duplo (Google Analytics + Umami)', () => {
    let gtag: ReturnType<typeof vi.fn<(...args: unknown[]) => void>>
    let umamiTrack: ReturnType<typeof vi.fn<(nome?: string, dados?: Record<string, unknown>) => void>>

    beforeEach(() => {
        gtag = vi.fn<(...args: unknown[]) => void>()
        umamiTrack = vi.fn<(nome?: string, dados?: Record<string, unknown>) => void>()
        window.gtag = gtag
        window.umami = { track: umamiTrack }
    })
    afterEach(() => { delete window.gtag; delete window.umami; vi.restoreAllMocks() })

    it('envia o mesmo evento aos dois destinos', () => {
        trackScrollDepth({ depth: 50, path: '/blog/x' })
        expect(gtag).toHaveBeenCalledWith('event', 'scroll_depth', { scroll_depth: 50, content_path: '/blog/x' })
        expect(umamiTrack).toHaveBeenCalledWith('scroll_depth', { scroll_depth: 50, content_path: '/blog/x' })
    })

    it('segue enviando ao Umami quando o gtag esta bloqueado', () => {
        delete window.gtag
        window.dataLayer = []
        trackBlogRead({ slug: 'artigo', seconds: 45 })
        expect(umamiTrack).toHaveBeenCalledWith('blog_read', { content_slug: 'artigo', read_seconds: 45 })
    })

    it('segue enviando ao gtag quando o Umami esta ausente', () => {
        delete window.umami
        expect(() => trackSearch('blackpink', 12)).not.toThrow()
        expect(gtag).toHaveBeenCalledWith('event', 'search', { search_term: 'blackpink', result_count: 12 })
    })

    it('nao lanca quando o proprio track do Umami falha', () => {
        window.umami = { track: () => { throw new Error('falhou') } }
        expect(() => trackSearch('teste', 0)).not.toThrow()
        expect(gtag).toHaveBeenCalled()
    })

    it('registra busca sem resultado — e o sinal de lacuna de conteudo', () => {
        trackSearch('assunto inexistente', 0)
        expect(umamiTrack).toHaveBeenCalledWith('search', { search_term: 'assunto inexistente', result_count: 0 })
    })

    it('trunca texto longo, que viraria rotulo permanente', () => {
        trackSearch('a'.repeat(200), 1)
        const dados = umamiTrack.mock.calls[0][1] as { search_term: string }
        expect(dados.search_term).toHaveLength(60)
    })

    it('preserva numeros e calcula o percentual do quiz', () => {
        trackQuizComplete({ score: 8, total: 10, points: 800, category: 'k-pop', difficulty: 'medio' })
        const dados = umamiTrack.mock.calls[0][1] as { quiz_pct: number; quiz_score: number }
        expect(dados.quiz_pct).toBe(80)
        expect(dados.quiz_score).toBe(8)
    })
})

describe('segunda rodada: amostragem e formato', () => {
    let umamiTrack: ReturnType<typeof vi.fn<(nome?: string, dados?: Record<string, unknown>) => void>>

    beforeEach(() => {
        umamiTrack = vi.fn<(nome?: string, dados?: Record<string, unknown>) => void>()
        window.umami = { track: umamiTrack }
        window.gtag = vi.fn()
        sessionStorage.clear()
    })
    afterEach(() => { delete window.gtag; delete window.umami; vi.restoreAllMocks() })

    it('Web Vital fora da amostra da sessão não é enviado', async () => {
        const { trackWebVital } = await import('./analytics')
        sessionStorage.setItem('hh-amostra-vitals', '0')
        trackWebVital({ nome: 'LCP', valor: 2400, avaliacao: 'good', tipoPagina: 'home' })
        expect(umamiTrack).not.toHaveBeenCalled()
    })

    // CLS é fração: arredondar a inteiro como os tempos apagaria a métrica.
    it('CLS mantém as casas decimais; os tempos saem em ms inteiros', async () => {
        const { trackWebVital } = await import('./analytics')
        sessionStorage.setItem('hh-amostra-vitals', '1')
        trackWebVital({ nome: 'CLS', valor: 0.04567, avaliacao: 'good', tipoPagina: 'artigo' })
        trackWebVital({ nome: 'INP', valor: 187.6, avaliacao: 'good', tipoPagina: 'artigo' })
        expect(umamiTrack).toHaveBeenCalledWith('web_vital', { metric: 'CLS', value: 0.046, rating: 'good', page_type: 'artigo' })
        expect(umamiTrack).toHaveBeenCalledWith('web_vital', { metric: 'INP', value: 188, rating: 'good', page_type: 'artigo' })
    })

    it('decisão pelo banner leva os segundos desde a exibição', async () => {
        vi.useFakeTimers()
        try {
            const { trackConsentBannerExibido, trackConsentDecidido } = await import('./analytics')
            trackConsentBannerExibido()
            vi.advanceTimersByTime(7_000)
            trackConsentDecidido({ decision: 'granted', origem: 'banner' })
            expect(umamiTrack).toHaveBeenLastCalledWith('consent_decision', expect.objectContaining({ seconds_to_decide: 7 }))
        } finally {
            vi.useRealTimers()
        }
    })
})
