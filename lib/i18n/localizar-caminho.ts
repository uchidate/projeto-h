import { DEFAULT_LOCALE, type Locale } from './config'
import { ROUTES, caminhoDe } from './routes'

type Rota = { pt: string; en: string }
type Padrao = { regex: RegExp; rota: Rota; parametros: number }

/** Padrões em português do registro de rotas; os mais específicos (menos parâmetros) vêm primeiro. */
const PADROES: Padrao[] = (Object.values(ROUTES) as Rota[])
    .map((rota) => {
        let parametros = 0
        const fonte = rota.pt
            .split(/(\[[^\]]+\])/)
            .map((parte) => {
                if (/^\[[^\]]+\]$/.test(parte)) { parametros++; return '([^/]+)' }
                return parte.replace(/[.*+?^${}()|\\]/g, '\\$&')
            })
            .join('')
        return { regex: new RegExp(`^${fonte}$`), rota, parametros }
    })
    .sort((a, b) => a.parametros - b.parametros)

/**
 * Converte um caminho interno escrito em português (`/artists/iu`, `/comidas/kimchi?x=1#a`)
 * para o caminho do idioma, com prefixo. Link externo, âncora, caminho já prefixado
 * e caminho fora do registro de rotas passam intactos.
 *
 * Existe para que o componente de link não dependa de cada chamada lembrar do idioma:
 * ~120 links fixos mandavam quem lia em inglês para a página em português.
 */
export function localizarCaminho(caminho: string, locale: Locale): string {
    if (locale === DEFAULT_LOCALE || !caminho.startsWith('/') || caminho.startsWith('//')) return caminho
    const corte = caminho.search(/[?#]/)
    const base = corte === -1 ? caminho : caminho.slice(0, corte)
    const resto = corte === -1 ? '' : caminho.slice(corte)
    const limpo = base.length > 1 && base.endsWith('/') ? base.slice(0, -1) : base
    for (const { regex, rota } of PADROES) {
        const m = regex.exec(limpo)
        if (!m) continue
        let n = 0
        const destino = caminhoDe(rota, locale).replace(/\[[^\]]+\]/g, () => m[++n])
        return `/${locale}${destino === '/' ? '' : destino}${resto}`
    }
    return caminho
}

/**
 * Reescreve os `href="/..."` de um trecho de HTML (corpo de ficha ou artigo vindo do WordPress).
 * Os textos traduzidos mantêm os links internos como no original em português; sem isto,
 * quem lê em inglês sai do idioma no primeiro clique.
 */
export function localizarHtml(html: string, locale: Locale): string {
    if (locale === DEFAULT_LOCALE || !html.includes('href=')) return html
    return html.replace(/(\bhref=)(["'])(\/[^"']*)\2/g, (_, attr: string, aspas: string, caminho: string) =>
        `${attr}${aspas}${localizarCaminho(caminho, locale)}${aspas}`)
}

/** Aplica `localizarHtml` a toda string de um valor (objeto, lista ou texto); o resto passa intacto. */
export function localizarLinksEm<T>(valor: T, locale: Locale): T {
    if (locale === DEFAULT_LOCALE) return valor
    if (typeof valor === 'string') return localizarHtml(valor, locale) as T
    if (Array.isArray(valor)) return valor.map((v) => localizarLinksEm(v, locale)) as T
    if (valor && typeof valor === 'object') {
        return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, localizarLinksEm(v, locale)])) as T
    }
    return valor
}
