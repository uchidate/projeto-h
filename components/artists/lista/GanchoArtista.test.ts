import { describe, expect, it } from 'vitest'
import { destaqueDe } from './GanchoArtista'
import type { WPArtist } from '@/lib/wordpress/types'

const artista = (acf: Record<string, unknown>, translations?: unknown) => ({ id: 1, slug: 'x', title: { rendered: 'X' }, acf, translations }) as unknown as WPArtist

describe('destaqueDe por idioma (vazamento de título em português, 2026-11-20)', () => {
    const kim = artista({ card_destaque: 'Tudo Bem Não Ser Normal', card_destaque_tipo: 'producao', essencia_obra_chave: 'Tudo Bem Não Ser Normal (2020)' })
    it('português segue com o card_destaque', () => {
        expect(destaqueDe(kim)).toEqual({ titulo: 'Tudo Bem Não Ser Normal', tipo: 'producao' })
    })
    it('em inglês sem tradução não mostra o título em português', () => {
        expect(destaqueDe(kim, 'en')).toBeNull()
    })
    it('em inglês com tradução em dia usa a obra-chave traduzida', () => {
        const traduzido = artista(kim.acf as Record<string, unknown>, { en: { acf: { essencia_obra_chave: "It's Okay to Not Be Okay (2020)" } } })
        expect(destaqueDe(traduzido, 'en')).toEqual({ titulo: "It's Okay to Not Be Okay", tipo: 'obra' })
        const velha = artista(kim.acf as Record<string, unknown>, { en: { stale: true, acf: { essencia_obra_chave: 'Velho (2020)' } } })
        expect(destaqueDe(velha, 'en')).toBeNull()
    })
    it('música não muda de idioma', () => {
        expect(destaqueDe(artista({ card_destaque: 'Dynamite', card_destaque_tipo: 'musica' }), 'es')).toEqual({ titulo: 'Dynamite', tipo: 'musica' })
    })
})
