import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { TRANSLATABLE_ACF, pickTranslatable } from './translatable-fields'

/**
 * O plugin PHP vive no repositorio privado de operacao. A comparacao roda quando
 * CPTS_PHP_PATH aponta para ele; fora disso e pulada, sem falhar.
 */
const CPTS_PHP = process.env.CPTS_PHP_PATH ?? ''

/** Lê o mapa de `oc_i18n_translatable_fields()` do mu-plugin sem executar PHP. */
function phpSchema() {
    const php = readFileSync(CPTS_PHP, 'utf8')
    const body = php.slice(php.indexOf('function oc_i18n_translatable_fields'), php.indexOf('function oc_i18n_pick_acf'))
    const lists: Record<string, string[]> = {}
    for (const [, name, items] of body.matchAll(/\$(\w+) = \[([^\]]*)\];/g)) {
        lists[name] = [...items.matchAll(/'([^']+)'/g)].map((m) => m[1])
    }
    const schema: Record<string, Record<string, true | string[]>> = {}
    for (const [, type, fields] of body.matchAll(/'(\w+)' => \[\n([\s\S]*?)\n\s*\],/g)) {
        schema[type] = Object.fromEntries(
            [...fields.matchAll(/'(\w+)' => (true|\$\w+)/g)].map(([, field, rule]) => [field, rule === 'true' ? true : lists[rule.slice(1)]]),
        )
    }
    return schema
}

describe('campos traduzíveis', () => {
    it.skipIf(!CPTS_PHP || !existsSync(CPTS_PHP))('o espelho PHP é idêntico ao TypeScript', () => {
        expect(phpSchema()).toEqual(JSON.parse(JSON.stringify(TRANSLATABLE_ACF)))
    })

    it('descarta campos fora do esquema e valores que não são texto', () => {
        const picked = pickTranslatable({
            subtitle: 'Sub EN',
            type: 'movie',
            trailer_url: 'https://evil',
            curiosidades: ['a', 2],
        }, TRANSLATABLE_ACF.production)
        expect(picked).toEqual({ subtitle: 'Sub EN' })
    })

    it('em listas de objetos mantém só as chaves permitidas', () => {
        const picked = pickTranslatable({
            story_chapters: [{ title: 'Debut', source_url: 'https://evil', period: '2007' }],
        }, TRANSLATABLE_ACF.group)
        expect(picked).toEqual({ story_chapters: [{ title: 'Debut', period: '2007' }] })
    })
})
