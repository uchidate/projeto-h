// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'

const { trackProductClick } = vi.hoisted(() => ({ trackProductClick: vi.fn() }))
vi.mock('@/lib/analytics', async importActual => ({ ...(await importActual<object>()), trackProductClick }))
vi.mock('next/image', () => ({
    // eslint-disable-next-line @next/next/no-img-element
    default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

import { ProdutoConhecidoTile, type OfertaResumo } from './ProdutoConhecidoTile'

const oferta = (id: number, extra: Partial<OfertaResumo> = {}): OfertaResumo => ({
    id, nome: `Oferta ${id}`, image: null, price: `R$ ${id},00`, store: 'shopee', href: `https://loja.test/${id}`, ...extra,
})
const montar = (ofertas: OfertaResumo[], image: string | null = null) =>
    render(<ProdutoConhecidoTile name="Shin Ramyun" image={image} emoji="🍜" ofertas={ofertas} contexto="empresa:nongshim" />)

/** Coloca o botão numa posição da tela, como o navegador informaria. */
function posicionarBotao(left: number, bottom = 200) {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
        { left, width: 120, bottom, top: bottom - 160, right: left + 120, height: 160, x: left, y: bottom - 160, toJSON: () => ({}) } as DOMRect,
    )
}
const popover = () => document.querySelector<HTMLElement>('[data-produto-popover]')
const abrir = () => fireEvent.click(screen.getByRole('button'))

beforeEach(() => { trackProductClick.mockClear(); window.innerWidth = 1024 })
afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('ProdutoConhecidoTile', () => {
    it('sem oferta mostra o produto sem link nem botão', () => {
        montar([])
        expect(screen.getByText('Shin Ramyun')).toBeTruthy()
        expect(screen.getByText('🍜')).toBeTruthy()
        expect(screen.queryByRole('link')).toBeNull()
        expect(screen.queryByRole('button')).toBeNull()
    })

    it('com uma oferta linka direto para a loja e mede o clique', () => {
        montar([oferta(7)], 'https://img.test/p.jpg')
        const link = screen.getByRole('link')
        expect(link.getAttribute('href')).toBe('https://loja.test/7')
        expect(link.getAttribute('rel')).toContain('sponsored')
        expect(link.textContent).toContain('Ver na Shopee')
        expect(screen.getByRole('img').getAttribute('alt')).toBe('Shin Ramyun')
        fireEvent.click(link)
        expect(trackProductClick).toHaveBeenCalledWith({ productId: 7, store: 'shopee', contexto: 'empresa:nongshim' })
    })

    it('loja desconhecida vira rótulo genérico', () => {
        montar([oferta(1, { store: 'outra' })])
        expect(screen.getByRole('link').textContent).toContain('Ver na loja')
    })

    it('conta lojas quando são diferentes e ofertas quando a loja é a mesma', () => {
        montar([oferta(1), oferta(2, { store: 'mercadolivre' })])
        expect(screen.getByRole('button').textContent).toContain('Ver em 2 lojas')
        cleanup()
        montar([oferta(1), oferta(2)])
        expect(screen.getByRole('button').textContent).toContain('2 ofertas')
    })

    it('abre o popover com preço por oferta e fecha no segundo toque', () => {
        posicionarBotao(500)
        montar([oferta(1), oferta(2, { price: null, store: 'outra', image: 'https://img.test/2.jpg' })])
        expect(popover()).toBeNull()
        abrir()
        expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('true')
        const links = screen.getAllByRole('link')
        expect(links.map(a => a.getAttribute('href'))).toEqual(['https://loja.test/1', 'https://loja.test/2'])
        expect(links[0].textContent).toContain('R$ 1,00')
        expect(links[1].textContent).toContain('outra')
        expect(links[1].textContent).toContain('Ver preço')
        expect(popover()?.style.top).toBe('208px')
        expect(popover()?.style.left).toBe('560px')
        abrir()
        expect(popover()).toBeNull()
    })

    it('fecha com Escape e com toque fora, mas não com toque dentro', () => {
        posicionarBotao(500)
        montar([oferta(1), oferta(2)])
        abrir()
        fireEvent.mouseDown(screen.getAllByRole('link')[0])
        expect(popover()).not.toBeNull()
        fireEvent.mouseDown(screen.getByRole('button'))
        expect(popover()).not.toBeNull()
        fireEvent.keyDown(document, { key: 'a' })
        expect(popover()).not.toBeNull()
        fireEvent.keyDown(document, { key: 'Escape' })
        expect(popover()).toBeNull()
        abrir()
        fireEvent.mouseDown(document.body)
        expect(popover()).toBeNull()
    })

    it('acompanha o botão quando a tira rola', () => {
        posicionarBotao(500)
        montar([oferta(1), oferta(2)])
        abrir()
        posicionarBotao(300, 120)
        act(() => { window.dispatchEvent(new Event('scroll')) })
        expect(popover()?.style.top).toBe('128px')
        expect(popover()?.style.left).toBe('360px')
    })

    it('no celular o popover não sai pela borda esquerda nem pela direita', () => {
        window.innerWidth = 390
        posicionarBotao(16)
        montar([oferta(1), oferta(2)])
        abrir()
        // 240px de largura, centrado no ponto left: precisa de 120px de cada lado, mais 8 de folga.
        expect(popover()?.style.left).toBe('128px')
        posicionarBotao(280)
        act(() => { window.dispatchEvent(new Event('resize')) })
        expect(popover()?.style.left).toBe('262px')
    })
})
