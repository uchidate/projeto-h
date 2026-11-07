/**
 * Navegador que se entrega como automatizado.
 *
 * Pega só o que o robô não esconde: `navigator.webdriver`, navegador sem
 * headless disfarçado (`HeadlessChrome` no User-Agent) e User-Agent vazio.
 * O crawler de 2026-11 que inflou o Umami e o relatório de tráfego inválido do
 * AdSense falsifica o resto; contra ele vale o gesto confiável (ver
 * AdSenseLoader) e o desafio por User-Agent no Cloudflare.
 */
export type MotivoDeRobo = 'webdriver' | 'headless' | 'ua_vazio'

export function motivoDoRobo(nav: Pick<Navigator, 'webdriver' | 'userAgent'>): MotivoDeRobo | null {
    if (nav.webdriver === true) return 'webdriver'
    const ua = nav.userAgent ?? ''
    if (ua.trim() === '') return 'ua_vazio'
    return /HeadlessChrome/i.test(ua) ? 'headless' : null
}

export function roboEvidente(nav: Pick<Navigator, 'webdriver' | 'userAgent'>): boolean {
    return motivoDoRobo(nav) !== null
}

/** Versão principal do Chrome no User-Agent: agrupa o crawler que falsifica um Chrome já defasado. */
export function versaoDoChrome(ua: string): number | null {
    const m = /Chrome\/(\d+)/.exec(ua ?? '')
    return m ? Number(m[1]) : null
}
