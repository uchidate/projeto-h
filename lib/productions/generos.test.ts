import { describe, expect, it } from 'vitest'
import type { WPTerm } from '@/lib/wordpress/types'
import { generosNoIdioma } from './generos'

const termo = (slug: string, name: string) => ({ id: 1, slug, name, count: 3 }) as WPTerm

describe('generosNoIdioma', () => {
    it('em português devolve os termos como vieram', () => {
        const generos = [termo('comedia', 'Comédia')]
        expect(generosNoIdioma(generos, 'pt')).toBe(generos)
    })

    it('em inglês troca o nome dos gêneros conhecidos e mantém os demais', () => {
        const nomes = generosNoIdioma([termo('comedia', 'Comédia'), termo('terror', 'Terror'), termo('outro', 'Outro')], 'en').map(g => g.name)
        expect(nomes).toEqual(['Comedy', 'Horror', 'Outro'])
    })
})
