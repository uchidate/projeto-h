// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GutenbergArticleRenderer } from './GutenbergArticleRenderer'
import { buildArticleModel, type WPArticleBlock } from '@/lib/blog/articleModel'
import { BLOCK_ALT_PREFIX } from '@/lib/constants/identidade.mjs'
import type { StoreProduct } from '@/lib/wordpress/store'

const block = (name: string, html: string, attrs = {}): WPArticleBlock => ({ name, html, attrs, innerBlocks: [] })

describe('GutenbergArticleRenderer', () => {
    it('renderiza o HTML produzido pelo WordPress com âncoras estáveis', () => {
        const model = buildArticleModel([
            block('core/paragraph', '<p>Lead factual do artigo.</p>'),
            block('core/paragraph', '<p>Contexto editorial do artigo.</p>'),
            block('core/heading', '<h2 class="wp-block-heading">Datas confirmadas</h2>'),
        ])
        const { container } = render(<GutenbergArticleRenderer model={model} />)
        expect(screen.getByRole('heading', { name: 'Datas confirmadas' })).toBeInTheDocument()
        expect(container.querySelector('#datas-confirmadas')).toHaveAttribute('data-article-block', 'core/heading')
        expect(container.firstElementChild).toHaveAttribute('data-article-model-version', '1')
    })

    describe('bloco de produto', () => {
        const nome = `${BLOCK_ALT_PREFIX}/product`
        const produto = (id: number): StoreProduct => ({
            id, title: { rendered: 'Pepero Original 47g' }, date_gmt: '2026-10-01T00:00:00',
            acf: { price: 'R$ 15,42', original_price: null, image_url: 'https://http2.mlstatic.com/x.jpg', affiliate_url: 'https://loja/x', store: 'mercadolivre', category: 'snacks', badge: null, rating: null, sold_count: null, featured: false, is_hidden: false, position: 50, related_group: null, related_artist: null, price_history: null },
        })
        const modelo = (id: number) => buildArticleModel([
            block('core/paragraph', '<p>Abertura do artigo com contexto suficiente.</p>'),
            block(nome, `<div class="oc-product" data-product-id="${id}"><p class="oc-product__caption">O biscoito do Pepero Day</p></div>`, { productId: id }),
            block('core/paragraph', '<p>Depois do produto, o texto continua.</p>'),
        ])

        it('mostra o cartão da loja com preço atual, link de afiliado e legenda', () => {
            const { container } = render(<GutenbergArticleRenderer model={modelo(5)} produtos={new Map([[5, produto(5)]])} contextoProduto="artigo:x:produto" />)
            expect(screen.getByText('Pepero Original 47g')).toBeInTheDocument()
            expect(screen.getByText('R$ 15,42')).toBeInTheDocument()
            expect(container.querySelector('a[href="https://loja/x"]')).toHaveAttribute('rel', expect.stringContaining('sponsored'))
            expect(screen.getByText('O biscoito do Pepero Day')).toBeInTheDocument()
            expect(container.querySelector('[data-produto-no-artigo="5"]')).not.toBeNull()
        })

        it('some do texto, sem deixar o marcador, quando o produto não está mais disponível', () => {
            const { container } = render(<GutenbergArticleRenderer model={modelo(9)} produtos={new Map()} />)
            expect(container.querySelector('[data-produto-no-artigo]')).toBeNull()
            expect(container.querySelector('.oc-product')).toBeNull()
            expect(screen.getByText('Depois do produto, o texto continua.')).toBeInTheDocument()
        })
    })
})
