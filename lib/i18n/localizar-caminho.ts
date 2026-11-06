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
