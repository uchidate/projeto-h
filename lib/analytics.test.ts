// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { trackQuizComplete, trackSearch, trackScrollDepth, trackBlogRead, trackProductClick, trackVitrineVista } from './analytics'

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

describe('slot de descoberta da vitrine', () => {
    const gtag = vi.fn<(...args: unknown[]) => void>()
    const umamiTrack = vi.fn<(nome?: string, dados?: Record<string, unknown>) => void>()
    beforeEach(() => { gtag.mockClear(); umamiTrack.mockClear(); window.gtag = gtag; window.umami = { track: umamiTrack } })
    afterEach(() => { delete window.gtag; delete window.umami })

    it('clique comum não ganha propriedade nova (o ranking por CTR segue igual)', () => {
        trackProductClick({ productId: 7, store: 'shopee', contexto: 'grupo:bts' })
        expect(umamiTrack).toHaveBeenCalledWith('product_click', { product_id: 7, product_store: 'shopee', click_context: 'grupo:bts' })
    })

    it('clique no slot de descoberta leva click_slot', () => {
        trackProductClick({ productId: 7, store: 'shopee', contexto: 'grupo:bts', descoberta: true })
        expect(umamiTrack).toHaveBeenCalledWith('product_click', { product_id: 7, product_store: 'shopee', click_context: 'grupo:bts', click_slot: 'descoberta' })
    })

    it('vista só leva discovery_ids quando o slot apareceu', () => {
        trackVitrineVista({ contexto: 'loja', produtoIds: [1, 2, 3] })
        expect(umamiTrack).toHaveBeenLastCalledWith('vitrine_view', { click_context: 'loja', product_ids: '1,2,3' })
        trackVitrineVista({ contexto: 'loja', produtoIds: [1, 2, 3], descobertaIds: [3] })
        expect(umamiTrack).toHaveBeenLastCalledWith('vitrine_view', { click_context: 'loja', product_ids: '1,2,3', discovery_ids: '3' })
    })
})

describe('marcarSessaoHumana', () => {
    afterEach(() => { delete window.umami; window.sessionStorage.clear() })

    it('marca a sessão e manda human_session uma vez por aba e por dia', async () => {
        const { marcarSessaoHumana } = await import('./analytics')
        const track = vi.fn()
        const identify = vi.fn()
        window.umami = { track, identify }
        marcarSessaoHumana()
        marcarSessaoHumana()
        expect(identify).toHaveBeenCalledTimes(2)
        expect(identify).toHaveBeenCalledWith({ humano: true })
        expect(track.mock.calls.filter(([nome]) => nome === 'human_session')).toHaveLength(1)
    })
})

describe('fila de eventos antes do Umami carregar', () => {
    beforeEach(() => { vi.useFakeTimers(); vi.resetModules(); delete window.umami; window.gtag = vi.fn() })
    afterEach(() => { vi.useRealTimers(); delete window.umami; delete window.gtag; delete window.dataLayer })

    it('entrega o evento quando o script chega, mesmo que um envio da fila falhe', async () => {
        const { trackMenuOpen, trackBlogSaibaMais } = await import('./analytics')
        trackMenuOpen()
        trackBlogSaibaMais()
        const track = vi.fn<(nome?: string, dados?: Record<string, unknown>) => void>().mockImplementationOnce(() => { throw new Error('falhou') })
        vi.advanceTimersByTime(250)
        expect(track).not.toHaveBeenCalled()
        window.umami = { track }
        vi.advanceTimersByTime(250)
        expect(track.mock.calls).toEqual([['menu_open', {}], ['blog_saiba_mais', { content_slug: '' }]])
        expect(vi.getTimerCount()).toBe(0)
    })

    it('desiste depois de 10 segundos e descarta o que estava na fila', async () => {
        const { trackMenuOpen, trackTema } = await import('./analytics')
        trackMenuOpen()
        vi.advanceTimersByTime(10_000)
        expect(vi.getTimerCount()).toBe(0)
        const track = vi.fn()
        window.umami = { track }
        trackTema('light')
        expect(track.mock.calls).toEqual([['theme_change', { theme: 'light' }]])
    })

    it('sem gtag, guarda o evento no dataLayer para o Google ler depois', async () => {
        delete window.gtag
        const { trackTema } = await import('./analytics')
        trackTema('dark')
        expect(window.dataLayer).toEqual([['event', 'theme_change', { theme: 'dark' }]])
    })
})

describe('eventos de anúncio', () => {
    const gtag = vi.fn<(...args: unknown[]) => void>()
    const track = vi.fn<(nome?: string, dados?: Record<string, unknown>) => void>()
    beforeEach(() => { gtag.mockClear(); track.mockClear(); window.gtag = gtag; window.umami = { track }; sessionStorage.clear() })
    afterEach(() => { delete window.gtag; delete window.umami; vi.restoreAllMocks() })

    it('fora da amostra vai só para o Google', async () => {
        const { trackAdRequest } = await import('./analytics')
        vi.spyOn(Math, 'random').mockReturnValue(0.5)
        trackAdRequest({ placement: 'topo', format: 'auto', queueDelayMs: -3 })
        expect(gtag).toHaveBeenCalledWith('event', 'ad_slot_request', { ad_placement: 'topo', ad_format: 'auto', ad_queue_delay_ms: 0 })
        expect(track).not.toHaveBeenCalled()
    })

    it('a sessão sorteada leva pedido e resultado juntos ao Umami', async () => {
        const { trackAdRequest, trackAdStatus } = await import('./analytics')
        const sorteio = vi.spyOn(Math, 'random').mockReturnValue(0.05)
        trackAdRequest({ placement: 'topo', format: 'auto', queueDelayMs: 12.6 })
        trackAdStatus({ placement: 'topo', format: 'auto', status: 'filled' })
        expect(track.mock.calls.map(c => c[0])).toEqual(['ad_slot_request', 'ad_slot_status'])
        expect(sorteio).toHaveBeenCalledTimes(1)
    })

    it('o resumo da página vai só ao Umami, com CLS multiplicado por mil', async () => {
        const { trackExperienciaAnuncios } = await import('./analytics')
        trackExperienciaAnuncios({
            proprios: 2, automaticos: 1, ancoraGoogle: true, ancoraGoogleFechada: false, ancoraPropria: false,
            alturaPct: 18, primeiraTela: true, vinheta: false, bannerAberto: true, bannerAbertoAoSair: false,
            clsMedido: true, cls: { anuncio: 0.0456, loja: 0.002, outro: 0 }, rolagemPct: 60, segundos: 40, tipoPagina: 'artigo',
        })
        expect(track).toHaveBeenCalledWith('page_ads', expect.objectContaining({ cls_ad: 46, cls_store: 2, cls_other: 0, page_type: 'artigo' }))
        expect(gtag).not.toHaveBeenCalled()
    })
})
