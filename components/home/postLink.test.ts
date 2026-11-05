import { describe, it, expect } from 'vitest'
import { postLink } from './postLink'

describe('postLink', () => {
    it('em português é só o caminho do artigo', () => {
        expect(postLink('meu-post', 'pt')).toEqual({ href: '/blog/meu-post' })
    })

    it('em inglês aponta à versão traduzida, sem aviso de idioma', () => {
        expect(postLink('my-post', 'en')).toEqual({ href: '/en/blog/my-post' })
    })
})
