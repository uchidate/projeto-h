// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReceitaPreparo } from './ReceitaPreparo'
import type { Receita } from '@/lib/receitas/tipos'

const receita: Receita = {
    porcoes: 4, preparoMin: 30, cozimentoMin: 60,
    ingredientes: [{ item: 'arroz', quantidade: '2 xícaras' }, { item: 'ovo', quantidade: '2' }, { item: 'sal', quantidade: '1 pitada' }],
    passos: ['Cozinhe o arroz até macio.', 'Frite os ovos em fogo médio.', 'Monte tudo e sirva quente.'],
    dicas: ['Use arroz de grão curto.'],
    fontes: [{ nome: 'Fonte A', url: 'https://a.com/r' }, { nome: 'Fonte B', url: 'https://b.com/r' }],
    conferidoEm: '2026-10-01',
}

describe('ReceitaPreparo', () => {
    it('mostra tempos, ingredientes, passos numerados e fontes', () => {
        render(<ReceitaPreparo nome="Kimbap" receita={receita} />)
        expect(screen.getByRole('heading', { name: 'Como preparar Kimbap' })).toBeTruthy()
        expect(screen.getByText('1 h 30 min')).toBeTruthy()
        expect(screen.getByText('2 xícaras')).toBeTruthy()
        expect(screen.getByText('Frite os ovos em fogo médio.')).toBeTruthy()
        expect(screen.getByRole('link', { name: 'Fonte B' }).getAttribute('href')).toBe('https://b.com/r')
    })
})
