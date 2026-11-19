import { describe, it, expect } from 'vitest'
import { validarReceita } from './validar'
import { receitaNoIdioma } from './index'
import type { ReceitaWP } from '@/lib/wordpress/receitas'
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

const doWP: ReceitaWP = {
    ...base,
    slug: 'kimbap',
    dicas: ['Use arroz morno.'],
    translations: {
        en: { acf: { ingredients: [{ item: 'rice', quantity: '2 cups' }, { item: 'egg', quantity: '2' }, { item: 'sesame oil', quantity: '1 tbsp' }], steps: ['Cook the rice until soft.', 'Fry the eggs over medium heat.', 'Mix everything and serve right away.'], tips: ['Use warm rice.'] } },
        ja: { stale: true, acf: { ingredients: [], steps: [], tips: [] } },
        es: { acf: { ingredients: [{ item: 'arroz', quantity: '2 tazas' }], steps: ['Cocina el arroz.'], tips: [] } },
    },
}

describe('receitaNoIdioma', () => {
    it('em português devolve a receita sem slug nem traduções', () => {
        const r = receitaNoIdioma(doWP, 'pt')!
        expect(r).not.toHaveProperty('slug')
        expect(r).not.toHaveProperty('translations')
        expect(r.passos).toEqual(base.passos)
    })

    it('troca só o texto: porções, tempos e fontes ficam os do português', () => {
        const r = receitaNoIdioma(doWP, 'en')!
        expect(r.ingredientes[0]).toEqual({ item: 'rice', quantidade: '2 cups' })
        expect(r.passos[2]).toBe('Mix everything and serve right away.')
        expect(r.dicas).toEqual(['Use warm rice.'])
        expect(r.porcoes).toBe(base.porcoes)
        expect(r.fontes).toEqual(base.fontes)
        expect(validarReceita('kimbap', r)).toEqual([])
    })

    it('sem tradução, desatualizada ou com estrutura diferente do português, a receita não existe no idioma', () => {
        expect(receitaNoIdioma({ ...doWP, translations: undefined }, 'en')).toBeNull()
        expect(receitaNoIdioma(doWP, 'ja')).toBeNull()
        expect(receitaNoIdioma(doWP, 'es')).toBeNull()
    })
})
