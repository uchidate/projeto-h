/**
 * Imagem de fundo da OG num formato que o `next/og` (satori) consegue ler.
 *
 * O satori só decodifica PNG, JPEG e GIF. Com WebP ele quebra por dentro
 * ("TypeError: b is not iterable") e a resposta inteira morre com "failed to
 * pipe response" — Sentry PHP-27 e PHP-2A, 2026-09-12, num post cuja imagem
 * destacada era .webp. Boa parte do acervo usa WebP, então descartar o formato
 * deixaria esses posts sem fundo; em vez disso, converte com o sharp (o mesmo
 * que o otimizador de imagens do Next já usa no container).
 */

/** Formatos que o satori decodifica sem conversão. */
const NATIVOS = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/gif'])

/** O fundo aparece desfocado e a 18% de opacidade: 1200 px bastam. */
const LARGURA_MAXIMA = 1200

export type Conversor = (bytes: Uint8Array) => Promise<Uint8Array>

export function tipoNativoDoSatori(contentType: string): boolean {
    return NATIVOS.has(contentType.split(';')[0].trim().toLowerCase())
}

async function converterComSharp(bytes: Uint8Array): Promise<Uint8Array> {
    const { default: sharp } = await import('sharp')
    const saida = await sharp(bytes)
        .resize({ width: LARGURA_MAXIMA, withoutEnlargement: true })
        .jpeg({ quality: 70 })
        .toBuffer()
    return new Uint8Array(saida)
}

/**
 * Devolve `{ tipo, bytes }` prontos para data URI, ou null quando a imagem não
 * serve (formato desconhecido ou conversão falhou) — o chamador gera a OG sem
 * fundo em vez de falhar.
 */
export async function prepararImagemParaOg(
    contentType: string,
    bytes: Uint8Array,
    converter: Conversor = converterComSharp,
): Promise<{ tipo: string; bytes: Uint8Array } | null> {
    const tipo = contentType.split(';')[0].trim().toLowerCase()
    if (!tipo.startsWith('image/') || bytes.byteLength === 0) return null
    if (tipoNativoDoSatori(tipo)) return { tipo, bytes }
    try {
        return { tipo: 'image/jpeg', bytes: await converter(bytes) }
    } catch {
        return null
    }
}
