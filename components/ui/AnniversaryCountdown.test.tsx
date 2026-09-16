// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnniversaryCountdown } from './AnniversaryCountdown'

describe('AnniversaryCountdown', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date(2026, 5, 1)) // 1 de junho de 2026
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('mostra a contagem quando o aniversário está dentro de 180 dias', () => {
        // debut 20 de junho (mesmo ano) → 19 dias a partir de 1 de junho
        render(<AnniversaryCountdown debutDate="20180620" groupName="BTS" />)
        expect(screen.getByText(/anos de estreia em 19 dias/i)).toBeInTheDocument()
    })

    it('não renderiza nada quando o aniversário está a mais de 180 dias', () => {
        // debut em dezembro → mais de 180 dias a partir de junho
        const { container } = render(<AnniversaryCountdown debutDate="20181225" groupName="BTS" />)
        expect(container).toBeEmptyDOMElement()
    })

    it('mostra "hoje!" quando o aniversário é hoje', () => {
        render(<AnniversaryCountdown debutDate="20180601" groupName="BTS" />)
        expect(screen.getByText(/hoje!/i)).toBeInTheDocument()
    })

    it('usa singular "dia" quando falta exatamente 1 dia', () => {
        render(<AnniversaryCountdown debutDate="20180602" groupName="BTS" />)
        expect(screen.getByText(/em 1 dia$/i)).toBeInTheDocument()
    })

    it('calcula o próximo aniversário no ano seguinte quando a data deste ano já passou', () => {
        // debut em maio (já passou este ano em relação a 1 de junho) → próximo é maio do ano que vem (long, >180d)
        const { container } = render(<AnniversaryCountdown debutDate="20180510" groupName="BTS" />)
        expect(container).toBeEmptyDOMElement()
    })

    it('calcula anos corretamente com base no ano do próximo aniversário', () => {
        render(<AnniversaryCountdown debutDate="20160620" groupName="BTS" />)
        expect(screen.getByText(/10 anos de estreia em 19 dias/i)).toBeInTheDocument()
    })

    it('retorna null (não renderiza) pra data inválida', () => {
        const { container } = render(<AnniversaryCountdown debutDate="data-invalida" groupName="BTS" />)
        expect(container).toBeEmptyDOMElement()
    })

    it('aceita o formato YYYY-MM-DD além do formato compacto YYYYMMDD', () => {
        render(<AnniversaryCountdown debutDate="2018-06-20" groupName="BTS" />)
        expect(screen.getByText(/anos de estreia em 19 dias/i)).toBeInTheDocument()
    })
})
