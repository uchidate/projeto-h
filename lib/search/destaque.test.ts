import { describe, it, expect } from 'vitest'
import { trechosDestacados } from './destaque'

const marcados = (t: string, q: string) => trechosDestacados(t, q).filter(x => x.marcado).map(x => x.texto)

describe('trechosDestacados', () => {
    it('marca o trecho digitado, sem diferenciar caixa', () => {
        expect(marcados('BLACKPINK', 'black')).toEqual(['BLACK'])
    })
    it('ignora acento em qualquer dos lados', () => {
        expect(marcados('José', 'jose')).toEqual(['Jos'.concat('é')])
        expect(marcados('Jose', 'josé')).toEqual(['Jose'])
    })
    it('marca cada palavra de uma consulta com várias palavras', () => {
        expect(marcados('Jisoo (BLACKPINK): Visual', 'jisoo blackpink')).toEqual(['Jisoo', 'BLACKPINK'])
    })
    it('marca hangul', () => {
        expect(marcados('김지수', '지수')).toEqual(['지수'])
    })
    it('sem correspondência devolve o texto inteiro, desmarcado', () => {
        expect(trechosDestacados('Lisa', 'jimin')).toEqual([{ texto: 'Lisa', marcado: false }])
    })
    it('não interpreta HTML nem regex do texto ou da consulta', () => {
        expect(trechosDestacados('<b>a.b</b>', 'a.b').map(t => t.texto).join('')).toBe('<b>a.b</b>')
        expect(marcados('a.b axb', 'a.b')).toEqual(['a.b'])
    })
})
