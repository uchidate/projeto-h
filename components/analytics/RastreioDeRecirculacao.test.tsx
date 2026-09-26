// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

const { trackRecirculacao, trackCliqueExterno, trackRecirculacaoVisto } = vi.hoisted(() => ({ trackRecirculacao: vi.fn(), trackCliqueExterno: vi.fn(), trackRecirculacaoVisto: vi.fn() }))
vi.mock('@/lib/analytics', () => ({ trackRecirculacao, trackCliqueExterno, trackRecirculacaoVisto }))
vi.mock('next/navigation', () => ({ usePathname: () => '/blog/x' }))

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

    describe('detalhe do clique', () => {
        it('informa se o bloco já tinha sido visto e os segundos até o clique', () => {
            let cb: IntersectionObserverCallback = () => {}
            vi.stubGlobal('IntersectionObserver', class {
                constructor(c: IntersectionObserverCallback) { cb = c }
                observe() {}
                disconnect() {}
            })
            const { container } = render(<><RastreioDeRecirculacao /><section data-bloco="artigo-continuar"><a href="/blog/a">A</a></section></>)
            const bloco = container.querySelector('section')!
            cb([{ target: bloco, isIntersecting: true } as unknown as IntersectionObserverEntry], {} as IntersectionObserver)
            clicar(container.querySelector('a')!)
            expect(trackRecirculacao).toHaveBeenLastCalledWith(expect.objectContaining({ bloco: 'artigo-continuar', visto: true, segundos: expect.any(Number) }))
            vi.unstubAllGlobals()
        })

        it('clique em bloco ainda não exibido diz visto: false; menu não informa visto', () => {
            vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} })
            const { container } = render(<><RastreioDeRecirculacao /><section data-bloco="artigo-continuar"><a href="/blog/a">A</a></section><nav data-bloco="menu"><a href="/artists">Artistas</a></nav></>)
            clicar(container.querySelector('section a')!)
            expect(trackRecirculacao).toHaveBeenLastCalledWith(expect.objectContaining({ bloco: 'artigo-continuar', visto: false }))
            clicar(container.querySelector('nav a')!)
            expect(trackRecirculacao).toHaveBeenLastCalledWith(expect.objectContaining({ bloco: 'menu', visto: undefined }))
            vi.unstubAllGlobals()
        })
    })

    describe('exibição do bloco', () => {
        let dispara: (el: Element, visivel?: boolean) => void
        let observados: Element[]

        beforeEach(() => {
            trackRecirculacaoVisto.mockClear()
            observados = []
            let cb: IntersectionObserverCallback = () => {}
            vi.stubGlobal('IntersectionObserver', class {
                constructor(c: IntersectionObserverCallback) { cb = c }
                observe(el: Element) { observados.push(el) }
                disconnect() {}
            })
            dispara = (el, visivel = true) => cb([{ target: el, isIntersecting: visivel } as IntersectionObserverEntry], {} as IntersectionObserver)
        })
        afterEach(() => { vi.unstubAllGlobals() })

        it('conta a exibição uma vez por bloco, mesmo que ele volte à tela', () => {
            const { container } = render(<><RastreioDeRecirculacao /><section data-bloco="artigo-leia-tambem"><a href="/blog/a">A</a></section></>)
            const bloco = container.querySelector('section')!
            dispara(bloco, false)
            expect(trackRecirculacaoVisto).not.toHaveBeenCalled()
            dispara(bloco)
            dispara(bloco)
            expect(trackRecirculacaoVisto).toHaveBeenCalledTimes(1)
            expect(trackRecirculacaoVisto).toHaveBeenCalledWith({ bloco: 'artigo-leia-tambem', origem: window.location.pathname })
        })

        it('não observa menu nem rodapé, que estão em toda página', () => {
            render(<><RastreioDeRecirculacao /><nav data-bloco="menu"><a href="/a">a</a></nav><footer data-bloco="rodape"><a href="/b">b</a></footer></>)
            expect(observados).toHaveLength(0)
        })

        it('bloco com display: contents é observado pelos filhos', () => {
            const { container } = render(<><RastreioDeRecirculacao /><div data-bloco="home-hero" style={{ display: 'contents' }}><section id="f"><a href="/x">x</a></section></div></>)
            const filho = container.querySelector('#f')!
            expect(observados).toEqual([filho])
            dispara(filho)
            expect(trackRecirculacaoVisto).toHaveBeenCalledWith(expect.objectContaining({ bloco: 'home-hero' }))
        })
    })
})
