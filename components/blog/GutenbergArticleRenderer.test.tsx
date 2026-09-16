// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GutenbergArticleRenderer } from './GutenbergArticleRenderer'
import { buildArticleModel, type WPArticleBlock } from '@/lib/blog/articleModel'

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
})
