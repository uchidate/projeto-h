// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

// Busca ao vivo dos hubs: acento, sinônimos, prioridade do título, limite de 8 e fechamento.
vi.mock('next-intl', () => ({
    useTranslations: () => (chave: string, valores?: Record<string, unknown>) => (valores ? `${chave} ${JSON.stringify(valores)}` : chave),
}))
vi.mock('@/components/i18n/LocalizedLink', () => ({
    default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} {...rest}>{children}</a>,
}))

import { HubBusca, type ItemBusca } from './HubBusca'

const item = (rotulo: string, extra: Partial<ItemBusca> = {}): ItemBusca => ({ rotulo, href: `/${rotulo}`, tipo: 'Guia', ...extra })

function montar(itens: ItemBusca[], sugestoes?: ItemBusca[]) {
    render(<HubBusca itens={itens} sugestoes={sugestoes} placeholder="Buscar" />)
    return screen.getByRole('textbox')
}
const digitar = (campo: HTMLElement, value: string) => fireEvent.change(campo, { target: { value } })
const resultados = () => screen.queryAllByRole('link').map(a => a.textContent)

afterEach(cleanup)

describe('HubBusca', () => {
    it('só mostra resultados a partir de duas letras', () => {
        const campo = montar([item('Kimchi')])
        digitar(campo, 'k')
        expect(resultados()).toEqual([])
        digitar(campo, 'ki')
        expect(resultados()).toEqual(['KimchiGuia'])
    })

    it('ignora acento e aceita sinônimo, com o título antes das palavras-chave', () => {
        const campo = montar([
            item('Onde assistir', { palavras: 'doramas' }),
            item('Dramas históricos'),
            item('Comidas'),
        ])
        digitar(campo, 'NÓVELA')
        expect(resultados()).toEqual(['Dramas históricosGuia', 'Onde assistirGuia'])
    })

    it('exige todas as palavras digitadas', () => {
        const campo = montar([item('Filmes de terror'), item('Filmes de romance')])
        digitar(campo, 'cinema terror')
        expect(resultados()).toEqual(['Filmes de terrorGuia'])
    })

    it('mostra no máximo 8 e oferece ver todos', () => {
        const campo = montar(Array.from({ length: 10 }, (_, i) => item(`Guia ${i}`)))
        digitar(campo, 'guia')
        expect(resultados()).toHaveLength(8)
        expect(screen.getByRole('button', { name: 'seeAll {"count":10}' }).getAttribute('type')).toBe('submit')
    })

    it('sem resultado oferece a busca do site e as sugestões', () => {
        const campo = montar([item('Kimchi')], [item('Soju')])
        digitar(campo, ' xyz ')
        expect(screen.getByText(/empty \{"termo":"xyz"\}/)).toBeTruthy()
        expect(screen.getByRole('button', { name: 'searchSite' })).toBeTruthy()
        expect(resultados()).toEqual(['Soju'])
        expect(campo.closest('form')!.getAttribute('action')).toBe('/search')
    })

    it('fecha com Esc e ao sair do formulário, e reabre ao voltar o foco', () => {
        const campo = montar([item('Kimchi')])
        digitar(campo, 'kimchi')
        fireEvent.keyDown(campo, { key: 'Escape' })
        expect(resultados()).toEqual([])
        fireEvent.focus(campo)
        expect(resultados()).toHaveLength(1)
        fireEvent.blur(campo, { relatedTarget: screen.getByRole('link') })
        expect(resultados()).toHaveLength(1)
        fireEvent.blur(campo, { relatedTarget: document.body })
        expect(resultados()).toEqual([])
    })
})
