// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { NavegacaoDeListagem } from './NavegacaoDeListagem'

const assign = vi.fn()

describe('NavegacaoDeListagem', () => {
    beforeEach(() => {
        assign.mockReset()
        Object.defineProperty(window, 'location', { configurable: true, value: { origin: 'http://localhost:3000', assign, search: '', pathname: '/productions' } })
    })

    function link(href: string, extra: Partial<HTMLAnchorElement> = {}) {
        const a = document.createElement('a')
        a.href = href
        Object.assign(a, extra)
        document.body.appendChild(a)
        return a
    }

    it('clique em link de listagem com filtro vira navegação completa e não chega ao handler do Link', () => {
        render(<NavegacaoDeListagem />)
        const doLink = vi.fn()
        const a = link('/productions?genre=drama')
        a.addEventListener('click', doLink)
        document.body.addEventListener('click', doLink)
        fireEvent.click(a)
        expect(assign).toHaveBeenCalledWith('http://localhost:3000/productions?genre=drama')
    })

    it('ignora link sem query, clique com modificador e nova aba', () => {
        render(<NavegacaoDeListagem />)
        fireEvent.click(link('/productions'))
        fireEvent.click(link('/productions?genre=drama'), { ctrlKey: true })
        fireEvent.click(link('/productions?genre=drama', { target: '_blank' }))
        expect(assign).not.toHaveBeenCalled()
    })

    it('paginação na mesma listagem guarda a rolagem e a devolve ao carregar', () => {
        Object.defineProperty(window, 'scrollY', { configurable: true, value: 640 })
        const scrollTo = vi.fn()
        window.scrollTo = scrollTo as unknown as typeof window.scrollTo
        const { unmount } = render(<NavegacaoDeListagem />)
        fireEvent.click(link('/productions?page=2'))
        unmount()
        render(<NavegacaoDeListagem />)
        expect(scrollTo).toHaveBeenCalledWith(0, 640)
    })

    it('filtro que leva a outra listagem não guarda rolagem', () => {
        const scrollTo = vi.fn()
        window.scrollTo = scrollTo as unknown as typeof window.scrollTo
        sessionStorage.clear()
        render(<NavegacaoDeListagem />)
        fireEvent.click(link('/blog?page=2'))
        expect(sessionStorage.getItem('hh_rolagem_listagem')).toBeNull()
    })
})
