import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/constants/site', () => ({ WORDPRESS_API_FALLBACK: 'https://padrao.example/wp-json' }))

import { urlDaApiValida } from './config'

describe('urlDaApiValida', () => {
    it('aceita o nome de serviço Docker por http', () => {
        expect(urlDaApiValida('http://wordpress-ondacoreana/wp-json')).toBe('http://wordpress-ondacoreana/wp-json')
    })
    it('aceita https público e loopback por http', () => {
        expect(urlDaApiValida('https://cms.example.com/wp-json')).toBe('https://cms.example.com/wp-json')
        expect(urlDaApiValida('http://127.0.0.1:8080/wp-json')).toBe('http://127.0.0.1:8080/wp-json')
    })
    it('recusa http em host com domínio público', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        expect(urlDaApiValida('http://cms.example.com/wp-json')).toBe('https://padrao.example/wp-json')
    })
    it('sem valor ou inválido usa o padrão', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        expect(urlDaApiValida(undefined)).toBe('https://padrao.example/wp-json')
        expect(urlDaApiValida('não é url')).toBe('https://padrao.example/wp-json')
    })
})
