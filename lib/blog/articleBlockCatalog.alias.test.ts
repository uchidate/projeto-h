import { describe, expect, it } from 'vitest'
import { ARTICLE_BLOCKS, isArticleBlockSupported } from './articleBlockCatalog'

describe('catálogo de blocos na troca de prefixo', () => {
    it('todo bloco próprio vale também sob hallyuhub/', () => {
        const proprios = [...ARTICLE_BLOCKS.keys()].filter((nome) => !nome.startsWith('core/') && !nome.startsWith('hallyuhub/'))
        // Com o prefixo já em hallyuhub não sobra nome antigo: o catálogo inteiro é o próprio alias.
        for (const nome of proprios) {
            expect(isArticleBlockSupported(`hallyuhub/${nome.split('/')[1]}`)).toBe(isArticleBlockSupported(nome))
        }
    })
    it('os 13 blocos próprios existem sob hallyuhub/ em qualquer configuração', () => {
        const esperados = ['stats', 'product', 'related-content', 'highlight', 'callout', 'marker-list', 'alert', 'spotify', 'pros-cons', 'spoiler', 'rating', 'ficha-drama', 'lyrics']
        for (const bloco of esperados) expect(isArticleBlockSupported(`hallyuhub/${bloco}`)).toBe(true)
    })
    it('blocos do core não ganham alias', () => {
        expect(ARTICLE_BLOCKS.has('hallyuhub/paragraph')).toBe(false)
    })
})
