// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalList } from './useLocalList'

describe('useLocalList', () => {
    beforeEach(() => localStorage.clear())

    it('começa vazio quando não há dados salvos', () => {
        const { result } = renderHook(() => useLocalList('minha-lista'))
        expect(result.current.ids).toEqual([])
        expect(result.current.ready).toBe(true)
    })

    it('hidrata a partir do localStorage existente', () => {
        localStorage.setItem('minha-lista', JSON.stringify([1, 2, 3]))
        const { result } = renderHook(() => useLocalList('minha-lista'))
        expect(result.current.ids).toEqual([1, 2, 3])
    })

    it('toggle adiciona um id que não está na lista', () => {
        const { result } = renderHook(() => useLocalList('minha-lista'))
        act(() => result.current.toggle(5))
        expect(result.current.ids).toEqual([5])
        expect(JSON.parse(localStorage.getItem('minha-lista')!)).toEqual([5])
    })

    it('toggle remove um id que já está na lista', () => {
        localStorage.setItem('minha-lista', JSON.stringify([5, 6]))
        const { result } = renderHook(() => useLocalList('minha-lista'))
        act(() => result.current.toggle(5))
        expect(result.current.ids).toEqual([6])
    })

    it('has retorna true/false corretamente', () => {
        localStorage.setItem('minha-lista', JSON.stringify([7]))
        const { result } = renderHook(() => useLocalList('minha-lista'))
        expect(result.current.has(7)).toBe(true)
        expect(result.current.has(8)).toBe(false)
    })

    it('não quebra com JSON inválido no localStorage (fallback pra vazio)', () => {
        localStorage.setItem('minha-lista', 'não é json válido{{{')
        const { result } = renderHook(() => useLocalList('minha-lista'))
        expect(result.current.ids).toEqual([])
        expect(result.current.ready).toBe(true)
    })

    it('não quebra quando localStorage.setItem lança erro (ex: quota excedida)', () => {
        const { result } = renderHook(() => useLocalList('minha-lista'))
        const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota exceeded') })
        act(() => result.current.toggle(1))
        expect(result.current.ids).toEqual([1])
        spy.mockRestore()
    })

    it('mantém listas independentes para keys diferentes', () => {
        localStorage.setItem('lista-a', JSON.stringify([1]))
        localStorage.setItem('lista-b', JSON.stringify([2]))
        const { result: a } = renderHook(() => useLocalList('lista-a'))
        const { result: b } = renderHook(() => useLocalList('lista-b'))
        expect(a.current.ids).toEqual([1])
        expect(b.current.ids).toEqual([2])
    })
})
