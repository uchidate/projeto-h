/**
 * Extração do IP do visitante atrás de proxy.
 *
 * `x-forwarded-for` chega como "cliente, proxy1, proxy2" — só o primeiro salto
 * representa quem fez a requisição. Usar a string inteira faz a chave mudar
 * junto com a rota da requisição, e qualquer contagem baseada nela nunca fecha.
 *
 * Três consumidores precisavam disso (report, revalidate, login) e cada um tinha
 * a sua versão; a de revalidate ainda usava a cadeia crua.
 */

/** Aceita tanto `Headers`/`NextRequest.headers` quanto o objeto simples do NextAuth. */
export type HeaderSource =
    | { get(name: string): string | null }
    | Record<string, string | string[] | undefined>
    | undefined

function readHeader(source: HeaderSource, name: string): string | undefined {
    if (!source) return undefined
    if (typeof (source as { get?: unknown }).get === 'function') {
        return (source as { get(n: string): string | null }).get(name) ?? undefined
    }
    const value = (source as Record<string, string | string[] | undefined>)[name]
    return Array.isArray(value) ? value[0] : value
}

/** Primeiro salto do x-forwarded-for, ou null quando não há origem confiável. */
export function clientIp(source: HeaderSource): string | null {
    const forwarded = readHeader(source, 'x-forwarded-for')?.split(',')[0]?.trim()
    if (forwarded) return forwarded
    return readHeader(source, 'x-real-ip')?.trim() || null
}

/** Versão para log e chave de contagem, onde ausência precisa de um rótulo. */
export function clientIpOrUnknown(source: HeaderSource): string {
    return clientIp(source) ?? 'unknown'
}
