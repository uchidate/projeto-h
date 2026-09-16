// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StoreCard } from './StoreCard'
import type { StoreProduct } from '@/lib/wordpress/store'

function product(overrides: Partial<StoreProduct['acf']> = {}, title = 'Produto Teste'): StoreProduct {
    return {
        id: 1,
        title: { rendered: title },
        acf: { affiliate_url: 'https://shopee.com/produto', store: 'shopee', ...overrides },
    } as unknown as StoreProduct
}

describe('StoreCard', () => {
    it('não renderiza nada sem affiliate_url', () => {
        const { container } = render(<StoreCard product={product({ affiliate_url: undefined })} />)
        expect(container).toBeEmptyDOMElement()
    })

    it('linka pra affiliate_url com atributos de link externo/patrocinado', () => {
        render(<StoreCard product={product()} />)
        const link = screen.getByRole('link')
        expect(link).toHaveAttribute('href', 'https://shopee.com/produto')
        expect(link).toHaveAttribute('target', '_blank')
        expect(link).toHaveAttribute('rel', 'noopener noreferrer sponsored')
    })

    it('decodifica entidades HTML no título (&amp; e &#8211;)', () => {
        render(<StoreCard product={product({}, 'Produto A &amp; B &#8211; Edição Especial')} />)
        expect(screen.getAllByText('Produto A & B – Edição Especial').length).toBeGreaterThan(0)
    })

    it('mostra o label da loja configurada (shopee)', () => {
        render(<StoreCard product={product({ store: 'shopee' })} />)
        expect(screen.getAllByText('Shopee').length).toBeGreaterThan(0)
    })

    it('cai no fallback "Ver produto" para loja desconhecida', () => {
        render(<StoreCard product={product({ store: 'loja-invalida' as never })} />)
        expect(screen.getAllByText('Ver produto').length).toBeGreaterThan(0)
    })

    it('usa "outro" como loja default quando não especificada', () => {
        render(<StoreCard product={product({ store: undefined })} />)
        expect(screen.getAllByText('Ver produto').length).toBeGreaterThan(0)
    })

    it('mostra o preço quando presente', () => {
        render(<StoreCard product={product({ price: 'R$ 99,90' })} />)
        expect(screen.getByText('R$ 99,90')).toBeInTheDocument()
    })

    it('mostra o preço original riscado quando presente', () => {
        render(<StoreCard product={product({ price: 'R$ 99,90', original_price: 'R$ 149,90' })} />)
        expect(screen.getByText('R$ 149,90')).toBeInTheDocument()
    })

    it('mostra a badge quando presente (modo não-compact)', () => {
        render(<StoreCard product={product({ badge: 'Mais vendido' })} />)
        expect(screen.getByText('Mais vendido')).toBeInTheDocument()
    })

    it('mostra o rating formatado com 1 casa decimal quando > 0', () => {
        render(<StoreCard product={product({ rating: 4.567 })} />)
        expect(screen.getByText('4.6')).toBeInTheDocument()
    })

    it('não mostra rating quando é 0', () => {
        render(<StoreCard product={product({ rating: 0 })} />)
        expect(screen.queryByText(/^\d\.\d$/)).not.toBeInTheDocument()
    })

    it('mostra contagem de vendidos quando presente, senão a legenda de curadoria', () => {
        const { rerender } = render(<StoreCard product={product({ sold_count: '120' })} />)
        expect(screen.getByText('120 vendidos')).toBeInTheDocument()

        rerender(<StoreCard product={product({ sold_count: undefined })} />)
        expect(screen.getByText('Curadoria Portal')).toBeInTheDocument()
    })

    it('modo compact renderiza um layout diferente (sem badge, com preço inline)', () => {
        render(<StoreCard product={product({ badge: 'Mais vendido', price: 'R$ 50' })} compact />)
        expect(screen.queryByText('Mais vendido')).not.toBeInTheDocument()
        expect(screen.getByText('R$ 50')).toBeInTheDocument()
    })
})
