// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BlogSuggestedNext } from './BlogSuggestedNext'
import type { WPPost } from '@/lib/wordpress/types'

function post(overrides: Partial<WPPost> = {}): WPPost {
    return {
        id: 1,
        slug: 'meu-post',
        title: { rendered: 'Meu Post Sugerido' },
        date: '2026-01-01T00:00:00',
        content: { rendered: '<p>' + 'palavra '.repeat(400) + '</p>' },
        featured_image_url: null,
        _embedded: undefined,
        acf: {},
        ...overrides,
    } as unknown as WPPost
}

describe('BlogSuggestedNext', () => {
    describe('pula o que o visitante ja leu', () => {
        beforeEach(() => {
            window.localStorage.clear()
        })

        it('escolhe o primeiro candidato ainda nao lido', async () => {
            window.localStorage.setItem('hh-lidos-v1', JSON.stringify(['ja-lido']))
            render(
                <BlogSuggestedNext
                    candidatos={[
                        post({ slug: 'ja-lido', title: { rendered: 'Ja Lido' } }),
                        post({ id: 2, slug: 'ainda-nao', title: { rendered: 'Ainda Nao' } }),
                    ]}
                />,
            )
            // A troca acontece num efeito, depois da montagem: escolher no
            // primeiro render quebraria a hidratacao, porque o servidor nao sabe
            // o que este visitante leu.
            expect(await screen.findAllByText('Ainda Nao')).not.toHaveLength(0)
        })

        it('mantem o mais relevante quando todos ja foram lidos', async () => {
            window.localStorage.setItem('hh-lidos-v1', JSON.stringify(['a', 'b']))
            render(
                <BlogSuggestedNext
                    candidatos={[
                        post({ slug: 'a', title: { rendered: 'Primeiro' } }),
                        post({ id: 2, slug: 'b', title: { rendered: 'Segundo' } }),
                    ]}
                />,
            )
            // Sugerir algo conhecido e melhor que sumir com o bloco, que tiraria
            // a unica saida no fim do artigo.
            expect(await screen.findAllByText('Primeiro')).not.toHaveLength(0)
        })
    })

    it('mostra o título do post sugerido', () => {
        render(<BlogSuggestedNext candidatos={[post()]} />)
        expect(screen.getAllByText('Meu Post Sugerido').length).toBeGreaterThan(0)
    })

    it('linka pro /blog/{slug}', () => {
        render(<BlogSuggestedNext candidatos={[post()]} />)
        expect(screen.getAllByRole('link')[0]).toHaveAttribute('href', '/blog/meu-post')
    })

    it('clicar em fechar remove o card da tela', async () => {
        const user = userEvent.setup()
        const { container } = render(<BlogSuggestedNext candidatos={[post()]} />)
        await user.click(screen.getByRole('button', { name: /fechar sugestão/i }))
        expect(container).toBeEmptyDOMElement()
    })

    it('usa reading_time do ACF quando presente, ignorando o cálculo automático', () => {
        render(<BlogSuggestedNext candidatos={[post({ acf: { reading_time: 7 } })]} />)
        expect(screen.getAllByText(/7 min/).length).toBeGreaterThan(0)
    })

    it('calcula o tempo de leitura automaticamente quando não há reading_time no ACF', () => {
        render(<BlogSuggestedNext candidatos={[post()]} />)
        expect(screen.getAllByText(/\d+ min/).length).toBeGreaterThan(0)
    })

    it('fixa o card no topo quando o scroll passa do placeholder original', () => {
        const { container } = render(<BlogSuggestedNext candidatos={[post()]} />)
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top: 10, left: 0, width: 600 } as DOMRect)
        fireEvent.scroll(window)
        const fixedEl = container.querySelector('.fixed') as HTMLElement | null
        expect(fixedEl).toBeInTheDocument()
        // O topo deriva das alturas que o cabeçalho e a barra de leitura
        // publicam, em vez do 92px que estava fixo no código. Aquele número
        // ficou errado quando `--site-header-h` virou constante: a barra de
        // leitura foi para 93 e o card ficou em 92, sobrepondo em vez de
        // empilhar. Asserção sobre o literal reproduziria o mesmo defeito.
        expect(fixedEl?.style.top).toContain('--site-header-h')
        expect(fixedEl?.style.top).toContain('--reading-bar-h')
        // E acompanha o cabeçalho por `translate`, não por `top`: animar `top`
        // recalcula layout a cada quadro e cada quadro entra no CLS.
        expect(fixedEl?.className).toContain('segue-header')
    })

    it('não fixa o card quando o placeholder ainda está abaixo do limite sticky', () => {
        const { container } = render(<BlogSuggestedNext candidatos={[post()]} />)
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top: 500, left: 0, width: 600 } as DOMRect)
        fireEvent.scroll(window)
        expect(container.querySelector('.fixed')).not.toBeInTheDocument()
    })
})
