import { describe, it, expect } from 'vitest'
import { postLink } from './postLink'

describe('postLink', () => {
    it('em português é só o caminho do artigo', () => {
        expect(postLink('meu-post', 'pt')).toEqual({ href: '/blog/meu-post' })
    })

    it('em inglês aponta ao original em português e avisa o idioma', () => {
        expect(postLink('meu-post', 'en')).toEqual({ href: '/blog/meu-post', hrefLang: 'pt-BR' })
    })
})
