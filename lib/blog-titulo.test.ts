import { describe, it, expect } from 'vitest'
import { tituloDoBlog } from './blog-titulo'

describe('tituloDoBlog', () => {
    it('sem filtro, é o título geral do blog', () => {
        expect(tituloDoBlog({})).toBe('Blog de K-Drama, K-Pop e cultura coreana')
    })

    it('cada filtro muda o título, na ordem busca > tag > categoria', () => {
        expect(tituloDoBlog({ categoria: 'K-Pop' })).toBe('Artigos sobre K-Pop')
        expect(tituloDoBlog({ categoria: 'K-Pop', tag: 'twice' })).toBe('Artigos com a tag twice')
        expect(tituloDoBlog({ categoria: 'K-Pop', tag: 'twice', busca: 'lisa' })).toBe('Busca por “lisa” no blog')
    })

    it('trata filtro vazio como ausente', () => {
        expect(tituloDoBlog({ categoria: '', tag: '', busca: '' })).toBe('Blog de K-Drama, K-Pop e cultura coreana')
    })
})
