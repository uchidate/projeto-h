// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, act, waitFor } from '@testing-library/react'
import type { StoreProduct } from '@/lib/wordpress/store'

const { trackProductClick, trackLojaDeslizanteFechada } = vi.hoisted(() => ({ trackProductClick: vi.fn(), trackLojaDeslizanteFechada: vi.fn() }))
vi.mock('@/lib/analytics', async importActual => ({ ...(await importActual<object>()), trackProductClick, trackLojaDeslizanteFechada }))
vi.mock('next/image', () => ({
    // eslint-disable-next-line @next/next/no-img-element
    default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

import { LojaDeslizante } from './LojaDeslizante'

const produto = (acf: Record<string, unknown> = {}) => ({
    id: 9,
    title: { rendered: 'Lightstick <em>oficial</em>' },
    acf: { affiliate_url: 'https://loja.test/9', store: 'shopee', price: 'R$ 80,00', original_price: 'R$ 100,00', image_url: 'https://img.test/9.jpg', ...acf },
}) as unknown as StoreProduct

const montar = (p?: StoreProduct) => render(<LojaDeslizante product={p} bloco="blog-deslizante" contexto="blog:x" />)
const cartao = () => document.querySelector<HTMLElement>('aside[data-bloco]')

function rolar(y: number) {
    Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
    act(() => { window.dispatchEvent(new Event('scroll')) })
}
const telaLarga = (larga: boolean) => { window.matchMedia = vi.fn().mockReturnValue({ matches: larga }) }
const caixa = (left: number, top: number, right: number, bottom: number) =>
    ({ left, top, right, bottom, width: right - left, height: bottom - top, x: left, y: top, toJSON: () => ({}) }) as DOMRect

/** Um anúncio no mesmo lugar do cartão. */
function anuncio(altura = 250) {
    const ad = document.createElement('ins')
    ad.className = 'adsbygoogle'
    ad.getBoundingClientRect = () => caixa(0, 500, 300, 500 + altura)
    return ad
}

beforeEach(() => {
    trackProductClick.mockClear(); trackLojaDeslizanteFechada.mockClear()
    sessionStorage.clear()
    telaLarga(true)
    window.innerHeight = 800
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2800, configurable: true })
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
    vi.stubGlobal('requestAnimationFrame', (f: FrameRequestCallback) => { f(0); return 0 })
    vi.stubGlobal('cancelAnimationFrame', () => {})
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(caixa(24, 400, 364, 776))
})
afterEach(() => { cleanup(); document.body.innerHTML = ''; vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('LojaDeslizante', () => {
    it('só aparece depois de 45% da página', () => {
        montar(produto())
        rolar(800)
        expect(cartao()).toBeNull()
        rolar(950)
        expect(cartao()).not.toBeNull()
    })

    it('não aparece em tela estreita, sem link, sem produto ou em página sem rolagem', () => {
        telaLarga(false)
        montar(produto()); rolar(2000)
        expect(cartao()).toBeNull()
        cleanup(); telaLarga(true)
        montar(produto({ affiliate_url: '' })); rolar(2000)
        expect(cartao()).toBeNull()
        cleanup()
        montar(undefined); rolar(2000)
        expect(cartao()).toBeNull()
        cleanup()
        Object.defineProperty(document.documentElement, 'scrollHeight', { value: 700, configurable: true })
        montar(produto()); rolar(2000)
        expect(cartao()).toBeNull()
    })

    it('mostra loja, preços e desconto, e mede o clique', () => {
        montar(produto()); rolar(2000)
        const link = screen.getByRole('link')
        expect(link.getAttribute('href')).toBe('https://loja.test/9')
        expect(link.getAttribute('rel')).toContain('sponsored')
        expect(link.textContent).toContain('Shopee')
        expect(link.textContent).toContain('-20%')
        expect(link.textContent).toContain('R$ 100,00')
        expect(screen.getByRole('img').getAttribute('alt')).toBe('Lightstick oficial')
        fireEvent.click(link)
        expect(trackProductClick).toHaveBeenCalledWith({ productId: 9, store: 'shopee', contexto: 'blog:x' })
    })

    it('sem desconto não risca preço, e loja desconhecida vira parceira', () => {
        montar(produto({ original_price: 'R$ 80,00', store: undefined, image_url: '' })); rolar(2000)
        expect(cartao()?.textContent).toContain('Loja parceira')
        expect(cartao()?.querySelector('.line-through')).toBeNull()
        expect(screen.queryByRole('img')).toBeNull()
        fireEvent.click(screen.getByRole('link'))
        expect(trackProductClick).toHaveBeenCalledWith({ productId: 9, store: 'outro', contexto: 'blog:x' })
    })

    it('fechar mede, some e não volta na mesma sessão', () => {
        montar(produto()); rolar(2000)
        fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
        expect(trackLojaDeslizanteFechada).toHaveBeenCalledWith('blog-deslizante')
        expect(cartao()).toBeNull()
        cleanup()
        montar(produto()); rolar(2100)
        expect(cartao()).toBeNull()
    })

    it('funciona com o armazenamento bloqueado', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('bloqueado') })
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('bloqueado') })
        montar(produto()); rolar(2000)
        fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
        expect(cartao()).toBeNull()
    })

    it('se esconde quando cruza um anúncio e volta quando a rolagem os separa', () => {
        const ad = anuncio()
        document.body.appendChild(ad)
        montar(produto()); rolar(2000)
        expect(cartao()?.className).toContain('invisible')
        expect(cartao()?.hasAttribute('inert')).toBe(true)
        ad.getBoundingClientRect = () => caixa(0, -900, 300, -650)
        rolar(2050)
        expect(cartao()?.className).not.toContain('invisible')
    })

    it('ignora anúncio vazio ou sem altura', () => {
        const vazio = anuncio(); vazio.setAttribute('data-ad-status', 'unfilled')
        document.body.append(vazio, anuncio(0))
        montar(produto()); rolar(2000)
        expect(cartao()?.className).not.toContain('invisible')
    })

    it('se esconde quando o anúncio preenche com a página parada', async () => {
        montar(produto()); rolar(2000)
        expect(cartao()?.className).not.toContain('invisible')
        const ad = anuncio(0)
        document.body.appendChild(ad)
        ad.getBoundingClientRect = () => caixa(0, 500, 300, 750)
        act(() => { ad.setAttribute('data-ad-status', 'filled') })
        await waitFor(() => expect(cartao()?.className).toContain('invisible'))
    })
})
