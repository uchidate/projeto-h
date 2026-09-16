// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

const { trackRecirculacao, trackCliqueExterno } = vi.hoisted(() => ({ trackRecirculacao: vi.fn(), trackCliqueExterno: vi.fn() }))
vi.mock('@/lib/analytics', () => ({ trackRecirculacao, trackCliqueExterno }))

import { RastreioDeRecirculacao } from './RastreioDeRecirculacao'

function clicar(el: Element) {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
}

describe('RastreioDeRecirculacao', () => {
    beforeEach(() => { trackRecirculacao.mockClear(); trackCliqueExterno.mockClear() })
    afterEach(() => { document.body.innerHTML = '' })

    it('registra bloco, posição e destino de link interno num bloco marcado', () => {
        const { container } = render(
            <>
                <RastreioDeRecirculacao />
                <section data-bloco="leia-tambem">
                    <a href="/blog/a">A</a>
                    <a href="/blog/b">B</a>
                </section>
            </>,
        )
        clicar(container.querySelector('a[href="/blog/b"]')!)
        expect(trackRecirculacao).toHaveBeenCalledWith(expect.objectContaining({ bloco: 'leia-tambem', posicao: 2, destino: '/blog/b' }))
    })

    // Card com imagem e título apontando para o mesmo lugar: o segundo card não
    // pode virar "posição 4".
    it('conta destinos distintos, não links', () => {
        const { container } = render(
            <>
                <RastreioDeRecirculacao />
                <section data-bloco="home-destaques">
                    <a href="/blog/a">img</a><a href="/blog/a">título</a>
                    <a href="/blog/b">img</a><a href="/blog/b">título</a>
                </section>
            </>,
        )
        clicar(container.querySelectorAll('a[href="/blog/b"]')[1])
        expect(trackRecirculacao).toHaveBeenCalledWith(expect.objectContaining({ posicao: 2 }))
    })

    it('ignora link fora de bloco marcado (menu, rodapé)', () => {
        const { container } = render(<><RastreioDeRecirculacao /><nav><a href="/blog/a">A</a></nav></>)
        clicar(container.querySelector('a')!)
        expect(trackRecirculacao).not.toHaveBeenCalled()
    })

    it('ignora link externo mesmo dentro de bloco', () => {
        const { container } = render(
            <><RastreioDeRecirculacao /><section data-bloco="x"><a href="https://exemplo.com/fora">F</a></section></>,
        )
        clicar(container.querySelector('a')!)
        expect(trackRecirculacao).not.toHaveBeenCalled()
    })

    it('registra clique externo com o host, mesmo fora de bloco', () => {
        const { container } = render(<><RastreioDeRecirculacao /><footer><a href="https://open.spotify.com/artist/x">S</a></footer></>)
        clicar(container.querySelector('a')!)
        expect(trackCliqueExterno).toHaveBeenCalledWith(expect.objectContaining({ host: 'open.spotify.com' }))
    })

    it('ignora link que não é http (mailto, tel)', () => {
        const { container } = render(<><RastreioDeRecirculacao /><a href="mailto:x@y.com">M</a></>)
        clicar(container.querySelector('a')!)
        expect(trackCliqueExterno).not.toHaveBeenCalled()
    })
})
