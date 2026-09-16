import { describe, expect, it } from 'vitest'
import { tipoDePagina } from './tipoDePagina'

describe('tipoDePagina', () => {
    it.each([
        ['/', 'home'],
        ['/blog', 'listagem-blog'],
        ['/blog/um-post', 'artigo'],
        ['/productions/x', 'ficha-producao'],
        ['/productions', 'listagem-producoes'],
        ['/artists/y', 'ficha-artista'],
        ['/groups/z', 'ficha-grupo'],
        ['/guias/doramas-romanticos', 'guia'],
        ['/entrar', 'conta'],
        ['/minhas-listas', 'area-logada'],
        ['/termos', 'outra'],
    ])('%s -> %s', (caminho, tipo) => {
        expect(tipoDePagina(caminho)).toBe(tipo)
    })
})
