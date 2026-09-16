// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QuizWidget } from './QuizWidget'

describe('QuizWidget', () => {
    it('usa "Hallyu" como categoria default (sem prop category)', () => {
        render(<QuizWidget />)
        expect(screen.getByText('Quiz Hallyu')).toBeInTheDocument()
        expect(screen.getByRole('link')).toHaveAttribute('href', '/quiz')
    })

    it('aponta o link pra /quiz?category=X quando uma categoria específica é passada', () => {
        render(<QuizWidget category="k-pop" />)
        expect(screen.getByRole('link')).toHaveAttribute('href', '/quiz?category=k-pop')
    })

    it('gera título/descrição default com base na categoria', () => {
        render(<QuizWidget category="k-drama" />)
        expect(screen.getByText(/você é expert em k-drama\?/i)).toBeInTheDocument()
        expect(screen.getByText(/quiz de k-drama/i)).toBeInTheDocument()
    })

    it('usa title/description customizados quando passados, ignorando os defaults', () => {
        render(<QuizWidget category="cultura" title="Título customizado" description="Descrição customizada" />)
        expect(screen.getByText('Título customizado')).toBeInTheDocument()
        expect(screen.getByText('Descrição customizada')).toBeInTheDocument()
        expect(screen.queryByText(/você é expert/i)).not.toBeInTheDocument()
    })

    it('cai pro meta de "all" quando a categoria não é reconhecida', () => {
        // @ts-expect-error testando categoria inválida de propósito
        render(<QuizWidget category="categoria-invalida" />)
        expect(screen.getByText('Quiz Hallyu')).toBeInTheDocument()
    })
})
