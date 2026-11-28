// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { BlogDaysUntil } from './BlogDaysUntil'

afterEach(() => { cleanup(); document.body.innerHTML = ''; vi.useRealTimers() })

describe('BlogDaysUntil', () => {
    it('preenche a contagem, remove datas passadas e ignora marcador vazio', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date(2026, 10, 27, 15, 30))
        document.body.innerHTML = ['2026-11-27', '2026-11-28', '2026-12-07', '2026-11-26', '']
            .map((d, i) => `<span id="c${i}" data-oc-countdown="${d}">...</span>`).join('')
        render(<BlogDaysUntil />)
        const texto = (i: number) => document.getElementById(`c${i}`)?.textContent
        expect([texto(0), texto(1), texto(2)]).toEqual(['É hoje', 'Falta 1 dia', 'Faltam 10 dias'])
        expect(document.getElementById('c0')?.classList.contains('is-ready')).toBe(true)
        expect(document.getElementById('c3')).toBeNull()
        expect(texto(4)).toBe('...')
    })
})
