// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { UmamiScript } from './UmamiScript'
import { umamiAntesDeEnviar } from '@/lib/umami-filtro'

/**
 * O que estes testes protegem.
 *
 * `data-auto-track="false"` (PR #56, 2026-09-22) desligou sem aviso a coleta de
 * Web Vitals do Umami v3, que só é iniciada junto do rastreamento automático:
 * a aba Desempenho ficou em branco. Estes testes travam os atributos que
 * mantêm a coleta de pé e o gancho que preserva a exclusão de /entrar e
 * /cadastro.
 */

const rota = { atual: '/blog' as string | null }

vi.mock('next/navigation', () => ({ usePathname: () => rota.atual }))
vi.mock('next/script', () => ({
    default: (props: Record<string, unknown>) => {
        const { strategy, ...resto } = props
        return <script data-strategy={String(strategy)} {...resto} />
    },
}))

const montar = (caminho: string | null) => {
    rota.atual = caminho
    return render(<UmamiScript src="/stats/script.js" websiteId="id-teste" hostUrl="/stats" domains="a.com" />)
}

describe('UmamiScript', () => {
    it('mantém o rastreamento automático ligado: sem data-auto-track="false"', () => {
        const { container } = montar('/blog')
        const s = container.querySelector('script')!
        expect(s.getAttribute('data-auto-track')).not.toBe('false')
    })

    it('pede a coleta de desempenho e registra o gancho de exclusão', () => {
        const { container } = montar('/blog')
        const s = container.querySelector('script')!
        expect(s.getAttribute('data-performance')).toBe('true')
        expect(s.getAttribute('data-before-send')).toBe('umamiAntesDeEnviar')
        expect(s.getAttribute('data-strategy')).toBe('lazyOnload')
    })

    it('expõe em window a função que o Umami vai chamar pelo nome', () => {
        montar('/blog')
        expect(window.umamiAntesDeEnviar).toBe(umamiAntesDeEnviar)
    })

    it('não monta o script nas rotas excluídas', () => {
        for (const r of ['/entrar', '/cadastro', '/cadastro/etapa-2']) {
            const { container, unmount } = montar(r)
            expect(container.querySelector('script')).toBeNull()
            unmount()
        }
    })
})
