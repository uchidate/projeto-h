// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BlockHeader } from './BlockHeader'
import { BlockSection } from './BlockSection'
import { FactGrid } from './FactGrid'
import { InfoCardGrid } from './InfoCardGrid'
import { NumberedList } from './NumberedList'

describe('primitivas de blocos', () => {
    it('BlockHeader controla semântica, tom, ação e BrandDot', () => {
        render(<BlockHeader title="Trajetória" eyebrow="Dossiê" headingLevel={3} tone="muted" brandDot action={<button>Abrir</button>} />)
        expect(screen.getByRole('heading', { level: 3, name: /trajetória/i })).toBeInTheDocument()
        expect(screen.getByText('Dossiê')).toHaveClass('text-muted')
        expect(screen.getByRole('button', { name: 'Abrir' })).toBeInTheDocument()
    })

    it('BlockHeader mostra a caixa depois do título, com cor opcional', () => {
        const { rerender } = render(<BlockHeader title="Em profundidade" tag="Leitura longa" />)
        const titulo = screen.getByRole('heading', { name: 'Em profundidade' })
        const caixa = screen.getByText('Leitura longa')
        expect(titulo.compareDocumentPosition(caixa) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
        expect(caixa).toHaveClass('border', 'text-accent')
        rerender(<BlockHeader title="Em profundidade" tag="Leitura longa" tagColor="#6d3fc0" />)
        expect(screen.getByText('Leitura longa')).toHaveStyle({ color: '#6d3fc0' })
    })

    it('BlockHeader sem tag não cria caixa', () => {
        render(<BlockHeader title="Sem caixa" />)
        expect(document.querySelector('span.border')).toBeNull()
    })

    it('BlockSection aplica layout e ritmo padronizados', () => {
        const { container } = render(<BlockSection id="bio" layout="page" spacing="default">Conteúdo</BlockSection>)
        expect(container.firstChild).toHaveClass('page-wrap', 'border-t', 'py-(--profile-section-block)')
        expect(container.querySelector('section')).toHaveAttribute('id', 'bio')
    })

    it('FactGrid não renderiza vazio e cria termos semânticos', () => {
        const empty = render(<FactGrid items={[]} />)
        expect(empty.container).toBeEmptyDOMElement()
        empty.unmount()
        render(<FactGrid items={[{ label: 'Estreia', value: '2016' }, { label: 'Integrantes', value: 4 }]} columns={4} />)
        expect(screen.getByText('Estreia').tagName).toBe('DT')
        expect(screen.getByText('2016').tagName).toBe('DD')
    })

    it('InfoCardGrid cria artigos e preserva conteúdo semântico', () => {
        render(<InfoCardGrid items={[{ key: 'faq', title: 'Quem é?', body: <p>Uma artista.</p>, meta: 'FAQ' }]} />)
        expect(screen.getByRole('article')).toBeInTheDocument()
        expect(screen.getByRole('heading', { level: 3, name: 'Quem é?' })).toBeInTheDocument()
        expect(screen.getByText('Uma artista.').tagName).toBe('P')
    })

    it('NumberedList numera visualmente os itens e não renderiza vazio', () => {
        const empty = render(<NumberedList items={[]} />)
        expect(empty.container).toBeEmptyDOMElement()
        empty.unmount()
        render(<NumberedList items={[{ key: 'a', content: 'Primeiro fato' }, { key: 'b', content: 'Segundo fato' }]} />)
        expect(screen.getAllByRole('listitem')).toHaveLength(2)
        expect(screen.getByText('1')).toHaveAttribute('aria-hidden', 'true')
    })
})
