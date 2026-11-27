// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'

type Evento = { data?: { isPaused?: boolean; position?: number; duration?: number } }
type Controle = {
    uri: string
    play: ReturnType<typeof vi.fn>
    pause: ReturnType<typeof vi.fn>
    togglePlay: ReturnType<typeof vi.fn>
    seek: ReturnType<typeof vi.fn>
    destroy: ReturnType<typeof vi.fn>
    emitir: (e: Evento) => void
}

const { api, carregar, controles } = vi.hoisted(() => {
    const controles: Controle[] = []
    const api = {
        createController: vi.fn((_el: HTMLElement, opcoes: { uri: string }, cb: (c: unknown) => void) => {
            let ouvinte: ((e: Evento) => void) | null = null
            const c = {
                uri: opcoes.uri,
                play: vi.fn(), pause: vi.fn(), togglePlay: vi.fn(), seek: vi.fn(), destroy: vi.fn(),
                addListener: (_nome: string, fn: (e: Evento) => void) => { ouvinte = fn },
                emitir: (e: Evento) => ouvinte?.(e),
            }
            controles.push(c as unknown as Controle)
            cb(c)
        }),
    }
    return { api, carregar: vi.fn(), controles }
})

// `t` estável, como no next-intl real: o efeito depende dele e re-executaria a cada render.
const traduzir = (k: string) => k
vi.mock('next-intl', () => ({ useTranslations: () => traduzir }))
vi.mock('@/lib/blog/spotifyIframeApi', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/blog/spotifyIframeApi')>()),
    carregarSpotifyIframeApi: carregar,
}))
vi.mock('@/components/blog/PlayerDock', () => ({
    PlayerDock: (p: {
        titulo: string; pausado: boolean; capa?: string; rotulo?: string; numero?: number; total?: number
        onAlternar: () => void; onIr: () => void; onFechar: () => void; onBuscar: (s: number) => void
        onAnterior?: () => void; onProxima?: () => void
    }) => (
        <div data-testid="dock" data-titulo={p.titulo} data-pausado={String(p.pausado)} data-capa={p.capa ?? ''}
            data-rotulo={p.rotulo ?? ''} data-numero={p.numero ?? ''} data-total={p.total ?? ''}>
            <button onClick={p.onAlternar}>alternar</button>
            <button onClick={p.onIr}>ir</button>
            <button onClick={p.onFechar}>fechar</button>
            <button onClick={() => p.onBuscar(42)}>buscar</button>
            {p.onAnterior && <button onClick={p.onAnterior}>anterior</button>}
            {p.onProxima && <button onClick={p.onProxima}>proxima</button>}
        </div>
    ),
}))

import { EmbedsSobDemanda } from './EmbedsSobDemanda'

/** IntersectionObserver de mentira: o teste decide quando cada iframe "chega perto da tela". */
const observadores: Array<{ cb: (e: Array<{ isIntersecting: boolean; target: Element }>) => void; alvos: Element[]; disconnect: ReturnType<typeof vi.fn> }> = []
class IOFalso {
    alvos: Element[] = []
    disconnect = vi.fn()
    constructor(public cb: (e: Array<{ isIntersecting: boolean; target: Element }>) => void) { observadores.push(this) }
    observe(el: Element) { this.alvos.push(el) }
    unobserve(el: Element) { this.alvos = this.alvos.filter((x) => x !== el) }
}

async function chegarPerto(...iframes: Element[]) {
    await act(async () => { observadores[0].cb(iframes.map((target) => ({ isIntersecting: true, target }))) })
}
const iframeDa = (id: string) => document.querySelector(`#${id} iframe`) as HTMLIFrameElement

const PAGINA = `
  <h1>ILLIT, bomb: faixa a faixa</h1>
  <nav data-indice-de-faixas><a href="#faixa-1">1</a><a href="#faixa-2">2</a><a href="#faixa-3">3</a></nav>
  <div class="oc-track" id="faixa-1"><h3>1. Magnetic</h3><iframe data-src="https://open.spotify.com/embed/track/AAA?utm=1" height="152"></iframe></div>
  <div class="oc-track" id="faixa-2"><h3>2.   Lucky   Girl</h3><iframe data-src="https://open.spotify.com/embed/track/BBB?utm=1"></iframe></div>
  <div class="oc-track" id="faixa-3"><h3>3. Tick-Tack</h3><iframe data-src="https://open.spotify.com/embed/track/CCC?utm=1"></iframe></div>`

describe('EmbedsSobDemanda — players do Spotify do artigo', () => {
    beforeEach(() => {
        controles.length = 0
        observadores.length = 0
        api.createController.mockClear()
        carregar.mockReset().mockResolvedValue(api)
        vi.stubGlobal('IntersectionObserver', IOFalso)
        vi.stubGlobal('CSS', { escape: (s: string) => s })
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => null }))
        Element.prototype.scrollIntoView = vi.fn()
        document.body.innerHTML = PAGINA
    })
    afterEach(() => {
        vi.useRealTimers()
        vi.unstubAllGlobals()
        Reflect.deleteProperty(navigator, 'mediaSession')
    })

    it('não renderiza nada nem observa quando o artigo não tem player adiado', () => {
        document.body.innerHTML = '<h1>Sem player</h1>'
        const { container } = render(<EmbedsSobDemanda />)
        expect(container).toBeEmptyDOMElement()
        expect(observadores).toHaveLength(0)
    })

    it('sem IntersectionObserver, libera todos os iframes de uma vez', () => {
        vi.stubGlobal('IntersectionObserver', undefined)
        render(<EmbedsSobDemanda />)
        const iframe = iframeDa('faixa-1')
        expect(iframe.getAttribute('src')).toBe('https://open.spotify.com/embed/track/AAA?utm=1')
        expect(iframe.hasAttribute('data-src')).toBe(false)
        expect(carregar).not.toHaveBeenCalled()
    })

    it('só ativa o player quando o iframe chega perto da tela', async () => {
        render(<EmbedsSobDemanda />)
        expect(observadores[0].alvos).toHaveLength(3)
        expect(api.createController).not.toHaveBeenCalled()
        await chegarPerto(iframeDa('faixa-1'))
        expect(api.createController).toHaveBeenCalledOnce()
        expect(api.createController).toHaveBeenCalledWith(expect.any(HTMLElement), { uri: 'spotify:track:AAA', width: '100%', height: 152 }, expect.any(Function))
        expect(document.querySelector('#faixa-1 iframe')).toBeNull()
        expect(observadores[0].alvos).toHaveLength(2)
    })

    it('se a iFrame API não carrega, cai no iframe comum que toca igual', async () => {
        carregar.mockResolvedValue(null)
        render(<EmbedsSobDemanda />)
        await chegarPerto(iframeDa('faixa-1'))
        expect(api.createController).not.toHaveBeenCalled()
        expect(iframeDa('faixa-1').getAttribute('src')).toBe('https://open.spotify.com/embed/track/AAA?utm=1')
    })

    it('iframe que não é do Spotify também vira iframe comum, sem carregar a API', async () => {
        document.body.innerHTML = '<div class="oc-track" id="x"><iframe data-src="https://example.com/embed/abc"></iframe></div>'
        render(<EmbedsSobDemanda />)
        await chegarPerto(iframeDa('x'))
        expect(carregar).not.toHaveBeenCalled()
        expect(iframeDa('x').getAttribute('src')).toBe('https://example.com/embed/abc')
    })

    it('ao tocar, mostra a barra com título limpo, posição na ordem do texto e rótulo do artigo', async () => {
        render(<EmbedsSobDemanda />)
        await chegarPerto(iframeDa('faixa-2'))
        act(() => controles[0].emitir({ data: { isPaused: false, position: 1000, duration: 200000 } }))
        const dock = screen.getByTestId('dock')
        expect(dock.dataset.titulo).toBe('Lucky Girl')
        expect(dock.dataset.numero).toBe('2')
        expect(dock.dataset.total).toBe('3')
        expect(dock.dataset.rotulo).toBe('ILLIT, bomb')
        expect(dock.dataset.pausado).toBe('false')
    })

    it('pausa as outras faixas quando uma começa e destaca cartão e atalho', async () => {
        render(<EmbedsSobDemanda />)
        await chegarPerto(iframeDa('faixa-1'), iframeDa('faixa-2'))
        act(() => controles[0].emitir({ data: { isPaused: false } }))
        expect(document.getElementById('faixa-1')?.getAttribute('data-tocando')).toBe('true')
        expect(document.querySelector('a[href="#faixa-1"]')?.getAttribute('aria-current')).toBe('true')
        controles.forEach((c) => c.pause.mockClear())

        act(() => controles[1].emitir({ data: { isPaused: false } }))
        expect(controles[0].pause).toHaveBeenCalled()
        expect(controles[1].pause).not.toHaveBeenCalled()
        expect(document.getElementById('faixa-1')?.hasAttribute('data-tocando')).toBe(false)
        expect(document.getElementById('faixa-2')?.getAttribute('data-tocando')).toBe('true')
    })

    it('ao pausar, a barra fica e o destaque sai', async () => {
        render(<EmbedsSobDemanda />)
        await chegarPerto(iframeDa('faixa-1'))
        act(() => controles[0].emitir({ data: { isPaused: false } }))
        act(() => controles[0].emitir({ data: { isPaused: true, position: 5000 } }))
        expect(screen.getByTestId('dock').dataset.pausado).toBe('true')
        expect(document.getElementById('faixa-1')?.hasAttribute('data-tocando')).toBe(false)
    })

    it('os botões da barra controlam o player: alternar, buscar, ir e fechar', async () => {
        render(<EmbedsSobDemanda />)
        await chegarPerto(iframeDa('faixa-1'))
        act(() => controles[0].emitir({ data: { isPaused: false } }))

        fireEvent.click(screen.getByText('alternar'))
        expect(controles[0].togglePlay).toHaveBeenCalledOnce()
        fireEvent.click(screen.getByText('buscar'))
        expect(controles[0].seek).toHaveBeenCalledWith(42)
        fireEvent.click(screen.getByText('ir'))
        expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
        fireEvent.click(screen.getByText('fechar'))
        expect(controles[0].pause).toHaveBeenCalled()
        expect(screen.queryByTestId('dock')).toBeNull()
    })

    it('a primeira faixa não tem "anterior" e a última não tem "próxima"', async () => {
        render(<EmbedsSobDemanda />)
        await chegarPerto(iframeDa('faixa-1'), iframeDa('faixa-3'))
        act(() => controles[0].emitir({ data: { isPaused: false } }))
        expect(screen.queryByText('anterior')).toBeNull()
        expect(screen.getByText('proxima')).toBeTruthy()
        act(() => controles[1].emitir({ data: { isPaused: false } }))
        expect(screen.getByText('anterior')).toBeTruthy()
        expect(screen.queryByText('proxima')).toBeNull()
    })

    it('"próxima" pausa a atual, rola até a faixa seguinte e dá play quando o player dela existe', async () => {
        render(<EmbedsSobDemanda />)
        await chegarPerto(iframeDa('faixa-1'), iframeDa('faixa-2'))
        act(() => controles[0].emitir({ data: { isPaused: false } }))
        vi.useFakeTimers()
        fireEvent.click(screen.getByText('proxima'))
        expect(controles[0].pause).toHaveBeenCalled()
        expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
        act(() => { vi.advanceTimersByTime(250) })
        expect(controles[1].play).toHaveBeenCalledOnce()
    })

    it('"próxima" desiste depois de ~5 s se o player da faixa de destino nunca aparece', async () => {
        render(<EmbedsSobDemanda />)
        await chegarPerto(iframeDa('faixa-1'))
        act(() => controles[0].emitir({ data: { isPaused: false } }))
        vi.useFakeTimers()
        fireEvent.click(screen.getByText('proxima'))
        act(() => { vi.advanceTimersByTime(10_000) })
        expect(vi.getTimerCount()).toBe(0)
    })

    it('busca a capa quadrada do álbum no oEmbed do Spotify e usa na barra', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ thumbnail_url: 'https://i.scdn.co/capa.jpg' }) }))
        render(<EmbedsSobDemanda />)
        await chegarPerto(iframeDa('faixa-1'))
        await act(async () => { controles[0].emitir({ data: { isPaused: false } }) })
        expect(fetch).toHaveBeenCalledWith('https://open.spotify.com/oembed?url=' + encodeURIComponent('https://open.spotify.com/track/AAA'))
        expect(screen.getByTestId('dock').dataset.capa).toBe('https://i.scdn.co/capa.jpg')
    })

    it('na ausência de oEmbed, a capa cai na imagem do artigo (og:image, parâmetro image)', async () => {
        document.head.innerHTML = '<meta property="og:image" content="https://site.test/og?image=https%3A%2F%2Fcdn.test%2Fcapa.jpg">'
        render(<EmbedsSobDemanda />)
        await chegarPerto(iframeDa('faixa-1'))
        await act(async () => { controles[0].emitir({ data: { isPaused: false } }) })
        expect(screen.getByTestId('dock').dataset.capa).toBe('https://cdn.test/capa.jpg')
        document.head.innerHTML = ''
    })

    it('ao desmontar, destrói os players e desliga o observador', async () => {
        const { unmount } = render(<EmbedsSobDemanda />)
        await chegarPerto(iframeDa('faixa-1'))
        unmount()
        expect(controles[0].destroy).toHaveBeenCalledOnce()
        expect(observadores[0].disconnect).toHaveBeenCalledOnce()
    })

    it('player que termina de criar depois de desmontar é destruído na hora', async () => {
        const pendente: { terminar?: () => void } = {}
        api.createController.mockImplementationOnce((_el, opcoes, cb) => {
            pendente.terminar = () => {
                const c = { uri: opcoes.uri, play: vi.fn(), pause: vi.fn(), togglePlay: vi.fn(), seek: vi.fn(), destroy: vi.fn(), addListener: vi.fn(), emitir: vi.fn() }
                controles.push(c as unknown as Controle)
                cb(c)
            }
        })
        const { unmount } = render(<EmbedsSobDemanda />)
        await chegarPerto(iframeDa('faixa-1'))
        unmount()
        pendente.terminar?.()
        expect(controles[0].destroy).toHaveBeenCalledOnce()
    })

    describe('Media Session', () => {
        function instalarMediaSession() {
            const sessao = { metadata: null as unknown, playbackState: 'none', setActionHandler: vi.fn(), setPositionState: vi.fn() }
            Object.defineProperty(navigator, 'mediaSession', { value: sessao, configurable: true })
            vi.stubGlobal('MediaMetadata', class { constructor(init: object) { Object.assign(this, init) } })
            return sessao
        }

        type Acao = ((d?: { seekTime?: number }) => void) | null
        const acoesDe = (sessao: ReturnType<typeof instalarMediaSession>) =>
            Object.fromEntries(sessao.setActionHandler.mock.calls as Array<[string, Acao]>) as Record<string, Acao>

        it('mostra a faixa nas teclas de mídia e liga previous/next conforme a posição', async () => {
            const sessao = instalarMediaSession()
            render(<EmbedsSobDemanda />)
            await chegarPerto(iframeDa('faixa-2'))
            act(() => controles[0].emitir({ data: { isPaused: false, position: 1000, duration: 200000 } }))
            expect(sessao.metadata).toMatchObject({ title: 'Lucky Girl', artist: 'ILLIT, bomb: faixa a faixa' })
            expect(sessao.playbackState).toBe('playing')
            const acoes = acoesDe(sessao)
            expect(acoes.previoustrack).toBeTypeOf('function')
            expect(acoes.nexttrack).toBeTypeOf('function')
            acoes.play?.()
            acoes.pause?.()
            acoes.seekto?.({ seekTime: 12 })
            expect(controles[0].play).toHaveBeenCalled()
            expect(controles[0].pause).toHaveBeenCalled()
            expect(controles[0].seek).toHaveBeenCalledWith(12)
            expect(sessao.setPositionState).toHaveBeenCalledWith({ duration: 200, position: 1, playbackRate: 1 })
        })

        it('na primeira faixa não há "previoustrack"', async () => {
            const sessao = instalarMediaSession()
            render(<EmbedsSobDemanda />)
            await chegarPerto(iframeDa('faixa-1'))
            act(() => controles[0].emitir({ data: { isPaused: false } }))
            const acoes = acoesDe(sessao)
            expect(acoes.previoustrack).toBeNull()
            expect(acoes.nexttrack).toBeTypeOf('function')
        })

        it('ação que o navegador não suporta não derruba a barra', async () => {
            const sessao = instalarMediaSession()
            sessao.setActionHandler.mockImplementation(() => { throw new TypeError('não suportado') })
            render(<EmbedsSobDemanda />)
            await chegarPerto(iframeDa('faixa-1'))
            act(() => controles[0].emitir({ data: { isPaused: false } }))
            expect(screen.getByTestId('dock')).toBeTruthy()
        })
    })
})
