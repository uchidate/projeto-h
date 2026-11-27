import { describe, it, expect } from 'vitest'
import { destinoSeguro } from './destinoSeguro'

const ORIGEM = 'https://www.hallyuhub.com.br'
const destino = (valor: string) => destinoSeguro(valor, '/dashboard', ORIGEM)

describe('destinoSeguro', () => {
    it.each([
        ['/perfil', '/perfil'],
        ['/artists/jimin?aba=obras#topo', '/artists/jimin?aba=obras#topo'],
        [`${ORIGEM}/en/profile`, '/en/profile'],
    ])('mantém %s dentro do site', (valor, esperado) => {
        expect(destino(valor)).toBe(esperado)
    })

    it.each([
        'https://outro.com/entrar',
        '//outro.com',
        '/\\outro.com',
        '/\t/outro.com',
        '/.//outro.com',
        'https://www.hallyuhub.com.br.outro.com/',
        'http://www.hallyuhub.com.br/perfil',
        'javascript:alert(1)',
        'data:text/html,oi',
        'http://[',
    ])('troca %j pela reserva', valor => {
        expect(destino(valor)).toBe('/dashboard')
    })
})
