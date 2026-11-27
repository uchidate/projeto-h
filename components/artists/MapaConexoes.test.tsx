// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

const { push, trackRecirculacao, idioma } = vi.hoisted(() => ({ push: vi.fn(), trackRecirculacao: vi.fn(), idioma: { atual: 'pt-BR' } }))
vi.mock('next/navigation', () => ({ usePathname: () => '/artists/centro', useRouter: () => ({ push }) }))
vi.mock('next-intl', async importActual => ({ ...(await importActual<object>()), useLocale: () => idioma.atual }))
vi.mock('next/link', () => ({
    default: ({ href, children, ...resto }: { href: string; children: ReactNode }) => <a href={href} {...resto}>{children}</a>,
}))
vi.mock('next/image', () => ({
    // eslint-disable-next-line @next/next/no-img-element
    default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))
vi.mock('@/lib/analytics', async importActual => ({ ...(await importActual<object>()), trackRecirculacao }))

import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { localizarCaminho } from '@/lib/i18n/localizar-caminho'
import { MapaConexoes, type NoMapa } from './MapaConexoes'

const nos: NoMapa[] = [
    { href: '/groups/grupo-a', label: 'Grupo A', img: null, tipo: 'grupo' },
    { href: '/artists/ana', label: 'Ana', img: 'https://img.test/ana.jpg', tipo: 'artista' },
    { href: '/productions/obra-x', label: 'Obra X', img: null, tipo: 'obra' },
]
const novoMapa = {
    centro: { label: 'Ana', img: null, href: '/artists/ana', tipo: 'artist' },
    nos: [
        { href: '/artists/bia', label: 'Bia', img: null, tipo: 'artista' },
        { href: '/productions/obra-y', label: 'Obra Y', img: null, tipo: 'obra' },
    ],
}
const responder = (corpo: unknown, ok = true) => ({ ok, status: ok ? 200 : 502, json: async () => corpo }) as Response
const buscar = vi.fn<(url: string) => Promise<Response>>()

const montar = () => render(
    <MapaConexoes centro={{ label: 'Centro', img: 'https://img.test/c.jpg', href: '/artists/centro', tipo: 'artist' }}
        nos={nos} accent="#f00" ariaLabel="Mapa" textos={{ voltar: 'Voltar', abrir: 'Abrir {name}' }} />,
)
const no = (nome: string) => screen.getByRole('link', { name: new RegExp(`${nome}$`) })
const mapa = () => screen.getByRole('navigation', { name: 'Mapa' })

beforeEach(() => {
    idioma.atual = DEFAULT_LOCALE
    push.mockClear(); trackRecirculacao.mockClear()
    buscar.mockReset().mockResolvedValue(responder(novoMapa))
    vi.stubGlobal('fetch', buscar)
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('MapaConexoes', () => {
    it('desenha o centro e um link por vínculo, com a obra no anel de fora', () => {
        montar()
        expect(screen.getByText('Centro')).toBeTruthy()
        expect(screen.getAllByRole('link').map(a => a.getAttribute('href'))).toEqual(nos.map(n => n.href))
        // grupo e artista no anel de dentro (topo e base); a obra cai no vão, no anel de fora
        expect(no('Grupo A').style.top).toBe('24%')
        expect(no('Ana').style.top).toBe('76%')
        expect(no('Obra X').style.left).toBe('91%')
        expect(screen.queryByRole('button')).toBeNull()
    })

    it('recentra no clique, mede e permite voltar', async () => {
        montar()
        fireEvent.click(no('Ana'))
        await screen.findByRole('link', { name: /Bia$/ })
        expect(buscar.mock.calls[0][0]).toContain('/api/conexoes?tipo=artist&slug=ana')
        expect(trackRecirculacao).toHaveBeenCalledWith({ bloco: 'mapa-conexoes', posicao: 2, destino: '/artists/ana', origem: '/artists/centro' })
        const abrir = screen.getByRole('link', { name: 'Abrir Ana' })
        expect(abrir.getAttribute('href')).toBe('/artists/ana')
        fireEvent.click(abrir)
        expect(trackRecirculacao).toHaveBeenLastCalledWith({ bloco: 'mapa-conexoes-abrir', posicao: 1, destino: '/artists/ana', origem: '/artists/centro' })
        fireEvent.click(screen.getByRole('button', { name: 'Voltar' }))
        expect(screen.getByText('Centro')).toBeTruthy()
        expect(screen.queryByRole('button')).toBeNull()
    })

    it('com tecla modificadora ou outro botão o link segue normal', () => {
        montar()
        for (const extra of [{ metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
            fireEvent.click(no('Ana'), extra)
        }
        expect(buscar).not.toHaveBeenCalled()
        expect(trackRecirculacao).not.toHaveBeenCalled()
    })

    it.each([
        ['a API falha', () => buscar.mockResolvedValue(responder({}, false))],
        ['a resposta tem menos de dois vínculos', () => buscar.mockResolvedValue(responder({ ...novoMapa, nos: [] }))],
        ['a rede cai', () => buscar.mockRejectedValue(new Error('rede'))],
    ])('abre a página quando %s', async (_caso, preparar) => {
        preparar()
        montar()
        fireEvent.click(no('Ana'))
        await waitFor(() => expect(push).toHaveBeenCalledWith('/artists/ana'))
        await waitFor(() => expect(mapa().getAttribute('aria-busy')).toBe('false'))
        expect(screen.getByText('Centro')).toBeTruthy()
    })

    it('em outro idioma pede o mapa nele e a saída de emergência não cai no português', async () => {
        idioma.atual = 'en'
        buscar.mockResolvedValue(responder({}, false))
        montar()
        fireEvent.click(no('Ana'))
        await waitFor(() => expect(push).toHaveBeenCalledWith(localizarCaminho('/artists/ana', 'en')))
        expect(localizarCaminho('/artists/ana', 'en')).toBe('/en/artists/ana')
        expect(buscar.mock.calls[0][0]).toContain('idioma=en')
    })

    it('ignora um segundo clique enquanto o primeiro carrega', async () => {
        let liberar: (r: Response) => void = () => {}
        buscar.mockReturnValue(new Promise<Response>(r => { liberar = r }))
        montar()
        fireEvent.click(no('Ana'))
        const segundo = fireEvent.click(no('Grupo A'))
        expect(segundo).toBe(false) // o navegador não sai da página
        expect(buscar).toHaveBeenCalledTimes(1)
        liberar(responder(novoMapa))
        await screen.findByRole('link', { name: /Bia$/ })
        // um único passo no histórico: um "voltar" basta
        fireEvent.click(screen.getByRole('button', { name: 'Voltar' }))
        expect(screen.queryByRole('button')).toBeNull()
    })

    it('trava o "voltar" enquanto carrega', async () => {
        montar()
        fireEvent.click(no('Ana'))
        await screen.findByRole('link', { name: /Bia$/ })
        await waitFor(() => expect(mapa().getAttribute('aria-busy')).toBe('false'))
        buscar.mockReturnValue(new Promise<Response>(() => {}))
        fireEvent.click(no('Bia'))
        await waitFor(() => expect((screen.getByRole('button', { name: 'Voltar' }) as HTMLButtonElement).disabled).toBe(true))
    })
})
