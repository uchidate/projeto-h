/**
 * Campos que uma tradução pode substituir — D5-b em docs/I18N-ARQUITETURA.md.
 *
 * Nem toda string do `acf` é texto: `type`, datas, URLs, cor e nome em hangul
 * também são strings, e uma tradução que as trocasse mudaria o tipo de uma
 * produção ou quebraria um link. Só o que está aqui é traduzível.
 *
 * Espelhado em `oc_i18n_translatable_fields()` (plugin de CPTs do WordPress);
 * `translatable-fields.test.ts` falha se os dois divergirem.
 *
 * `true` = string ou lista de strings; lista de chaves = lista de objetos, da
 * qual só essas chaves são traduzíveis.
 */
export type FieldRule = true | readonly string[]
export type TranslatableSchema = { readonly [field: string]: FieldRule }

export const TRANSLATABLE_TOP_LEVEL = ['title', 'content', 'excerpt', 'seo_title', 'seo_description'] as const

const CHAPTER = ['period', 'title', 'description', 'visual_alt', 'quote_text', 'quote_context'] as const
const METRIC = ['value', 'label', 'context', 'as_of'] as const

export const TRANSLATABLE_ACF = {
    artist: {
        birth_place: true,
        curiosidades: true,
        awards: true,
        milestones: true,
        essencia_virada: true,
        essencia_por_que_importa: true,
        essencia_obra_chave: true,
        essencia_marca: true,
        essencia_porta_entrada: true,
        essencia_tags: true,
        career_statement: true,
        career_statement_sub: true,
        editorial_analysis: true,
        bio_quote_text: true,
        bio_quote_context: true,
        story_chapters: CHAPTER,
        key_metrics: METRIC,
    },
    group: {
        name_meaning: true,
        lightstick: true,
        curiosidades: true,
        // A análise editorial do grupo ficava de fora e aparecia em português
        // inteira na ficha em inglês (visto em /en/groups/blackpink, 2026-09-16).
        editorial_analysis: true,
        story_chapters: CHAPTER,
        key_metrics: METRIC,
    },
    production: {
        subtitle: true,
        curiosidades: true,
    },
} as const satisfies Record<string, TranslatableSchema>

export type TranslatableType = keyof typeof TRANSLATABLE_ACF

/** Recorta um objeto `acf` de tradução para só o que o esquema permite. */
export function pickTranslatable(acf: unknown, schema: TranslatableSchema): Record<string, unknown> {
    if (!acf || typeof acf !== 'object' || Array.isArray(acf)) return {}
    const source = acf as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const [field, rule] of Object.entries(schema)) {
        const value = source[field]
        if (value === undefined) continue
        if (rule === true) {
            if (typeof value === 'string' || (Array.isArray(value) && value.every((item) => typeof item === 'string'))) out[field] = value
            continue
        }
        if (!Array.isArray(value)) continue
        out[field] = value.map((item) => {
            if (!item || typeof item !== 'object') return {}
            const row = item as Record<string, unknown>
            return Object.fromEntries(rule.filter((key) => typeof row[key] === 'string').map((key) => [key, row[key]]))
        })
    }
    return out
}
