// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MarcosFaixa, temMarcosSuficientes, type Marco } from './MarcosFaixa'

const tipos = { estreia: 'Estreia', fase: 'Fase', obra: 'Obra', premio: 'Prêmio' }
const m = (ano: number, titulo = 'X', tipo: Marco['tipo'] = 'obra'): Marco => ({ ano, tipo, titulo })

describe('temMarcosSuficientes', () => {
    it('exige 4 marcos', () => {
        expect(temMarcosSuficientes([m(2000), m(2001), m(2002)])).toBe(false)
        expect(temMarcosSuficientes([m(2000), m(2001), m(2002), m(2003)])).toBe(true)
    })
    it('exige pelo menos 2 anos distintos', () => {
        expect(temMarcosSuficientes([m(2000), m(2000), m(2000), m(2000)])).toBe(false)
    })
})

describe('MarcosFaixa', () => {
    it('agrupa por ano em ordem crescente e linka obras', () => {
        render(<MarcosFaixa tipos={tipos} accent="#f00" ariaLabel="Marcos" marcos={[
            { ano: 2010, tipo: 'obra', titulo: 'Depois', href: '/productions/depois' },
            m(2001, 'Antes', 'premio'),
        ]} />)
        const anos = screen.getAllByText(/^20\d\d$/).map(e => e.textContent)
        expect(anos).toEqual(['2001', '2010'])
        expect(screen.getByRole('link', { name: 'Depois' }).getAttribute('href')).toBe('/productions/depois')
        expect(screen.getByText('Antes').closest('a')).toBeNull()
    })
    it('limita a 4 por ano e indica o restante', () => {
        render(<MarcosFaixa tipos={tipos} accent="#f00" ariaLabel="Marcos" marcos={Array.from({ length: 6 }, (_, i) => m(2020, `T${i}`))} />)
        expect(screen.getByText('+2')).toBeTruthy()
    })
})
