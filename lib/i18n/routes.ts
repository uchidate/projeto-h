import { DEFAULT_LOCALE, type Locale } from './config'

/**
 * Registro único dos caminhos por idioma — ver D3 em docs/I18N-ARQUITETURA.md.
 *
 * Escopo inicial do inglês: fichas de artista, grupo e produção, suas listagens
 * e a home. Rota fora deste registro não tem versão em outro idioma.
 */
export const ROUTES = {
    home: { pt: '/', en: '/' },
    artists: { pt: '/artists', en: '/artists' },
    artist: { pt: '/artists/[slug]', en: '/artists/[slug]' },
    groups: { pt: '/groups', en: '/groups' },
    group: { pt: '/groups/[slug]', en: '/groups/[slug]' },
    productions: { pt: '/productions', en: '/productions' },
    production: { pt: '/productions/[slug]', en: '/productions/[slug]' },
} as const satisfies Record<string, Record<Locale, string>>

export type RouteName = keyof typeof ROUTES

type ParamsOf<P extends string> = P extends `${string}[${infer K}]${infer Rest}`
    ? { [key in K]: string } & ParamsOf<Rest>
    : unknown

type RouteParams<R extends RouteName> = ParamsOf<(typeof ROUTES)[R]['pt']>

/** Caminho público da rota no idioma, já com prefixo (`/en/...`) quando não é PT. */
export function href<R extends RouteName>(
    route: R,
    ...[params, locale = DEFAULT_LOCALE]: keyof RouteParams<R> extends never
        ? [params?: undefined, locale?: Locale]
        : [params: RouteParams<R>, locale?: Locale]
): string {
    const pattern: string = ROUTES[route][locale]
    const path = pattern.replace(/\[([^\]]+)\]/g, (_, key: string) => {
        const value = (params as Record<string, string> | undefined)?.[key]
        if (!value) throw new Error(`href('${route}'): parâmetro "${key}" ausente`)
        return encodeURIComponent(value)
    })
    if (locale === DEFAULT_LOCALE) return path
    return path === '/' ? `/${locale}` : `/${locale}${path}`
}
