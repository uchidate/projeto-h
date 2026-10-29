import { describe, expect, it } from 'vitest'
import { ARTICLE_BLOCKS, isArticleBlockSupported } from './articleBlockCatalog'

describe('catálogo de blocos na troca de prefixo', () => {
    it('todo bloco próprio vale também sob hallyuhub/', () => {
        const proprios = [...ARTICLE_BLOCKS.keys()].filter((nome) => !nome.startsWith('core/') && !nome.startsWith('hallyuhub/'))
        expect(proprios.length).toBeGreaterThan(0)
        for (const nome of proprios) {
            expect(isArticleBlockSupported(`hallyuhub/${nome.split('/')[1]}`)).toBe(isArticleBlockSupported(nome))
        }
    })
    it('blocos do core não ganham alias', () => {
        expect(ARTICLE_BLOCKS.has('hallyuhub/paragraph')).toBe(false)
    })
})
