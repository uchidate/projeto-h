/**
 * Navegador que se entrega como automatizado.
 *
 * Pega só o que o robô não esconde: `navigator.webdriver`, navegador sem
 * headless disfarçado (`HeadlessChrome` no User-Agent) e User-Agent vazio.
 * O crawler de 2026-11 que inflou o Umami e o relatório de tráfego inválido do
 * AdSense falsifica o resto; contra ele vale o gesto confiável (ver
 * AdSenseLoader) e o desafio por User-Agent no Cloudflare.
 */
export function roboEvidente(nav: Pick<Navigator, 'webdriver' | 'userAgent'>): boolean {
    if (nav.webdriver === true) return true
    const ua = nav.userAgent ?? ''
    return ua.trim() === '' || /HeadlessChrome/i.test(ua)
}
