import { describe, it, expect } from 'vitest'
import { validarReceita } from './validar'
import { todasReceitas } from './index'
import type { Receita } from './tipos'

const base: Receita = {
    porcoes: 4,
    preparoMin: 20,
    cozimentoMin: 30,
    ingredientes: [
        { item: 'arroz', quantidade: '2 xícaras' },
        { item: 'ovo', quantidade: '2 unidades' },
        { item: 'óleo de gergelim', quantidade: '1 colher de sopa' },
    ],
    passos: ['Cozinhe o arroz até ficar macio.', 'Frite os ovos em fogo médio.', 'Misture tudo e sirva em seguida.'],
    fontes: [
        { nome: 'Fonte A', url: 'https://a.example.com/receita' },
        { nome: 'Fonte B', url: 'https://www.b.example.org/receita' },
    ],
    conferidoEm: '2026-10-01',
}

describe('validarReceita', () => {
    it('aceita uma receita completa', () => {
        expect(validarReceita('kimbap', base)).toEqual([])
    })

    it('exige duas fontes de sites diferentes', () => {
        const mesmo = { ...base, fontes: [base.fontes[0], { nome: 'Outra página', url: 'https://a.example.com/outra' }] }
        expect(validarReceita('kimbap', mesmo).join()).toContain('sites diferentes')
        expect(validarReceita('kimbap', { ...base, fontes: [base.fontes[0]] }).join()).toContain('mínimo de 2 fontes')
    })

    it('rejeita fonte sem https e tempo zerado', () => {
        const ruim = { ...base, preparoMin: 0, cozimentoMin: 0, fontes: [base.fontes[0], { nome: 'x', url: 'http://b.com' }] }
        const erros = validarReceita('kimbap', ruim).join()
        expect(erros).toContain('url inválida')
        expect(erros).toContain('tempo total')
    })

    it('rejeita ingrediente sem quantidade e poucos passos', () => {
        const ruim = { ...base, ingredientes: [...base.ingredientes.slice(0, 2), { item: 'sal', quantidade: '' }], passos: ['curto'] }
        const erros = validarReceita('kimbap', ruim).join()
        expect(erros).toContain('item e quantidade')
        expect(erros).toContain('mínimo de 3 passos')
    })
})

describe('data/receitas.json', () => {
    // Trava de CI: nenhuma receita entra no site sem passar na validação.
    it('todas as receitas publicadas são válidas', () => {
        const erros = Object.entries(todasReceitas()).flatMap(([slug, r]) => validarReceita(slug, r))
        expect(erros).toEqual([])
    })
})
