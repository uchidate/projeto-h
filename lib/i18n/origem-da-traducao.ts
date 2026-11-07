import { createHash } from 'node:crypto'

/**
 * Detecta tradução desatualizada. Cada tradução guarda, num arquivo ao lado, o hash do texto de
 * ORIGEM (português) que foi traduzido. Se o português muda e o inglês não é revisto, o hash atual
 * deixa de bater e o teste acusa — sem isso a tradução fica errada sem aviso, porque os testes só
 * conferem estrutura. Mesma ideia do lock de `messages` (messages/.i18n-lock.<idioma>.json).
 */

/** Serialização estável (chaves ordenadas) para o hash não depender da ordem dos campos. */
function estavel(valor: unknown): string {
    if (Array.isArray(valor)) return `[${valor.map(estavel).join(',')}]`
    if (valor && typeof valor === 'object') {
        const o = valor as Record<string, unknown>
        return `{${Object.keys(o).sort().map(k => `${JSON.stringify(k)}:${estavel(o[k])}`).join(',')}}`
    }
    return JSON.stringify(valor) ?? 'null'
}

export function hashDoTexto(valor: unknown): string {
    return createHash('sha1').update(estavel(valor)).digest('hex').slice(0, 12)
}

export type DiferencaDeOrigem = {
    /** Português mudou depois da tradução. */
    desatualizadas: string[]
    /** Tradução sem hash registrado. */
    semRegistro: string[]
    /** Hash registrado de item que não existe mais. */
    orfas: string[]
}

/** `atual` = hash do texto de origem hoje; `registrado` = o que estava quando se traduziu. */
export function compararOrigem(atual: Record<string, string>, registrado: Record<string, string>): DiferencaDeOrigem {
    return {
        desatualizadas: Object.keys(atual).filter(k => k in registrado && registrado[k] !== atual[k]),
        semRegistro: Object.keys(atual).filter(k => !(k in registrado)),
        orfas: Object.keys(registrado).filter(k => !(k in atual)),
    }
}
