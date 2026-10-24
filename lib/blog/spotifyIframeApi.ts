/** Controle de um player do Spotify criado pela iFrame API (só o que o site usa). */
export interface SpotifyController {
    play: () => void
    pause: () => void
    togglePlay: () => void
    seek: (segundos: number) => void
    destroy: () => void
    addListener: (evento: 'ready' | 'playback_update', cb: (e: { data?: { isPaused?: boolean; isBuffering?: boolean; position?: number; duration?: number } }) => void) => void
}

export interface SpotifyIFrameApi {
    createController: (
        elemento: HTMLElement,
        opcoes: { uri: string; width?: string | number; height?: string | number },
        cb: (controller: SpotifyController) => void,
    ) => void
}

declare global {
    interface Window {
        onSpotifyIframeApiReady?: (api: SpotifyIFrameApi) => void
    }
}

const SCRIPT = 'https://open.spotify.com/embed/iframe-api/v1'
const LIMITE_MS = 6000

let promessa: Promise<SpotifyIFrameApi | null> | null = null

/**
 * Carrega a iFrame API do Spotify uma única vez. Devolve `null` se o script não chegar
 * a tempo (bloqueador, rede ruim): quem chama cai no iframe comum, que continua tocando.
 */
export function carregarSpotifyIframeApi(): Promise<SpotifyIFrameApi | null> {
    if (promessa) return promessa
    promessa = new Promise((resolve) => {
        if (typeof window === 'undefined') return resolve(null)
        const prazo = window.setTimeout(() => resolve(null), LIMITE_MS)
        window.onSpotifyIframeApiReady = (api) => {
            window.clearTimeout(prazo)
            resolve(api)
        }
        const s = document.createElement('script')
        s.src = SCRIPT
        s.async = true
        s.onerror = () => { window.clearTimeout(prazo); resolve(null) }
        document.head.appendChild(s)
    })
    return promessa
}

/** `https://open.spotify.com/embed/track/ID?x` → `spotify:track:ID`; outra coisa → null. */
export function uriDoEmbed(src: string): string | null {
    const m = src.match(/open\.spotify\.com\/embed\/(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]+)/)
    return m ? `spotify:${m[1]}:${m[2]}` : null
}

/** Reinicia o cache da promessa (só para testes). */
export function _reiniciarSpotifyIframeApi() { promessa = null }
