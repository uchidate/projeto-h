import { describe, it, expect } from 'vitest'
import { montarEditorias } from './editorias'
import type { WPPost } from '@/lib/wordpress/types'

const post = (id: number) => ({ id }) as unknown as WPPost
const ids = (c: { posts: WPPost[] }) => c.posts.map(p => p.id)

describe('montarEditorias', () => {
    it('mantém a ordem recebida e a ordem das colunas', () => {
        const r = montarEditorias({ cultura: [post(5), post(6)], kpop: [post(1), post(2), post(3)] })
        expect(r.map(c => c.coluna.chave)).toEqual(['kpop', 'cultura'])
        expect(ids(r[0])).toEqual([1, 2, 3])
    })

    it('some a coluna com menos de dois posts', () => {
        const r = montarEditorias({ kpop: [post(1), post(2)], doramas: [post(3)] })
        expect(r.map(c => c.coluna.chave)).toEqual(['kpop'])
    })

    it('pula as matérias já usadas em outra vitrine', () => {
        const r = montarEditorias({ kpop: [post(1), post(2), post(3)] }, new Set([1]))
        expect(ids(r[0])).toEqual([2, 3])
    })

    it('uma matéria entra em uma só coluna', () => {
        const r = montarEditorias({ kpop: [post(1), post(2)], doramas: [post(2), post(3), post(4)] })
        expect(ids(r[1])).toEqual([3, 4])
    })

    it('respeita o limite por coluna', () => {
        const r = montarEditorias({ kpop: [1, 2, 3, 4, 5, 6].map(post) }, new Set(), 4)
        expect(ids(r[0])).toEqual([1, 2, 3, 4])
    })
})
