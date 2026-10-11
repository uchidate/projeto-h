// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { ClarityScript } from './ClarityScript'
import { CONSENT_STORAGE_KEY } from '@/lib/consent'

const rota = { atual: '/blog' as string | null }

vi.mock('next/navigation', () => ({ usePathname: () => rota.atual }))
vi.mock('next/script', () => ({
    default: ({ children, strategy, id, src }: { children?: string; strategy?: string; id?: string; src?: string }) => (
        <script data-strategy={strategy} data-src={src} id={id}>{children}</script>
    ),
}))

const decidir = (decision: 'granted' | 'denied' | null) => {
    localStorage.clear()
    if (decision) localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ decision, at: Date.now() }))
}

const montar = (caminho: string) => {
    rota.atual = caminho
    return render(<ClarityScript projectId="abc123" />)
}

describe('ClarityScript', () => {
    beforeEach(() => {
        delete window.clarity
    })

    it('não carrega sem decisão: dado pessoal exige aceite explícito', () => {
        decidir(null)
        expect(montar('/blog').container.querySelector('script')).toBeNull()
    })

    it('não carrega para quem recusou', () => {
        decidir('denied')
        expect(montar('/blog').container.querySelector('script')).toBeNull()
    })

    it('carrega com aceite e aponta para o projeto', () => {
        decidir('granted')
        const { container } = montar('/blog')
        const tag = container.querySelector('script#clarity-tag')!
        expect(tag.getAttribute('data-src')).toBe('https://www.clarity.ms/tag/abc123')
        expect(tag.getAttribute('data-strategy')).toBe('lazyOnload')
        const init = container.querySelector('script#clarity-init')!
        expect(init.textContent).toContain('consentv2')
        expect(init.textContent).not.toContain('abc123')
    })

    it('não grava nas telas de senha mesmo com aceite', () => {
        decidir('granted')
        expect(montar('/entrar').container.querySelector('script')).toBeNull()
        expect(montar('/cadastro/etapa-2').container.querySelector('script')).toBeNull()
    })
})
