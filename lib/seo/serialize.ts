export function omitNulls(_key: string, value: unknown) {
    return value === null ? undefined : value
}

/** Serializa JSON-LD sem permitir que conteúdo externo encerre a tag script. */
export function serializeJsonLd(value: unknown): string {
    return (JSON.stringify(value, omitNulls) ?? 'null')
        .replace(/</g, '\\u003c')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029')
}
