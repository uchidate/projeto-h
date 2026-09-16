export type AdRuntimeFormat = 'auto' | 'rectangle' | 'horizontal' | 'vertical' | 'fluid' | 'autorelaxed'
export type AdRuntimeStatus = 'filled' | 'unfilled' | 'timeout'

/** Normaliza os valores reais usados pelo AdSense, inclusive unfill-optimized. */
export function parseAdSenseStatus(rawStatus: string | null): Exclude<AdRuntimeStatus, 'timeout'> | null {
    if (rawStatus === 'filled') return 'filled'
    if (rawStatus?.startsWith('unfill')) return 'unfilled'
    return null
}

/**
 * Política única de runtime para anúncios manuais.
 *
 * Os prazos começam somente depois do `adsbygoogle.push()`. São longos o
 * bastante para WebKit/redes lentas concluírem o leilão, mas finitos para
 * bloqueadores ou falhas de inventário não deixarem espaços permanentes.
 */
export const AD_RUNTIME = {
    requestTimeoutMs: {
        auto: 20_000,
        rectangle: 20_000,
        horizontal: 20_000,
        vertical: 25_000,
        fluid: 20_000,
        autorelaxed: 25_000,
    } satisfies Record<AdRuntimeFormat, number>,
    sticky: {
        revealDelayMs: 2_500,
        requestTimeoutMs: 20_000,
    },
} as const
