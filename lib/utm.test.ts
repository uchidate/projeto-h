import { describe, expect, it } from 'vitest'
import { campanhaDoCaminho, comUtm } from './utm'

describe('comUtm', () => {
    const utm = { source: 'whatsapp', medium: 'share', campaign: 'um-post' }

    it('acrescenta os três parâmetros', () => {
        const url = new URL(comUtm('https://www.example.com/blog/um-post', utm))
        expect(url.searchParams.get('utm_source')).toBe('whatsapp')
        expect(url.searchParams.get('utm_medium')).toBe('share')
        expect(url.searchParams.get('utm_campaign')).toBe('um-post')
    })

    it('preserva parâmetros existentes', () => {
        const url = new URL(comUtm('https://www.example.com/productions?genre=romance', utm))
        expect(url.searchParams.get('genre')).toBe('romance')
    })

    // Link que já veio de campanha mantém a campanha original: repassar não
    // pode apagar a origem verdadeira do tráfego.
    it('não sobrescreve UTM que já exista', () => {
        const url = new URL(comUtm('https://www.example.com/x?utm_source=newsletter', utm))
        expect(url.searchParams.get('utm_source')).toBe('newsletter')
    })

    it('devolve o texto original se não for URL válida', () => {
        expect(comUtm('não é url', utm)).toBe('não é url')
    })
})

describe('campanhaDoCaminho', () => {
    it('usa o slug final', () => {
        expect(campanhaDoCaminho('https://www.example.com/blog/um-post')).toBe('um-post')
        expect(campanhaDoCaminho('https://www.example.com/')).toBe('home')
    })
})
