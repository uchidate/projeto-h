import { describe, it, expect } from 'vitest'
import { linkDaPlataforma } from '@/lib/productions/plataformas'

describe('linkDaPlataforma', () => {
    it('abre a busca do próprio serviço, com o título codificado, para os verificados', () => {
        expect(linkDaPlataforma('netflix', 'Manager Kim')).toEqual({ href: 'https://www.netflix.com/search?q=Manager%20Kim', direto: true })
        expect(linkDaPlataforma('apple-tv', 'Pousando no Amor').href).toBe('https://tv.apple.com/br/search?term=Pousando%20no%20Amor')
    })
    it('codifica caracteres que quebrariam a consulta', () => {
        expect(linkDaPlataforma('globoplay', 'A & B? #1').href).toBe('https://globoplay.globo.com/busca/?q=A%20%26%20B%3F%20%231')
    })
    it('cai para a busca do JustWatch quando o serviço não foi verificado', () => {
        expect(linkDaPlataforma('prime-video', 'Manager Kim')).toEqual({ href: 'https://www.justwatch.com/br/busca?q=Manager%20Kim', direto: false })
        expect(linkDaPlataforma('serviço-desconhecido', 'X').direto).toBe(false)
    })
})
