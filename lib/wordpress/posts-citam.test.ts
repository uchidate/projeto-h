import { describe, it, expect } from 'vitest'
import { filtrarPostsQueCitam } from './posts'

const post = (t: string, e = '') => ({ title: { rendered: t }, excerpt: { rendered: e } })

describe('filtrarPostsQueCitam', () => {
    it('aceita título ou resumo com o nome, sem acento nem caixa', () => {
        const r = filtrarPostsQueCitam([post('Choco Pie: história'), post('Outro', 'sobre o CHOCO PIE'), post('Bolo')], 'choco pie')
        expect(r).toHaveLength(2)
    })
    it('nome curto demais não filtra nada', () => {
        expect(filtrarPostsQueCitam([post('Kimchi')], 'ki')).toEqual([])
    })
})
