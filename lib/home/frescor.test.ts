import { describe, it, expect } from 'vitest'
import { escolherCapa, idadeEmDias, DIAS_CAPA_FRESCA } from '@/lib/home/frescor'
import type { WPPost } from '@/lib/wordpress/types'

const agora = new Date('2026-10-18T12:00:00Z')
const post = (id: number, date: string) => ({ id, date }) as unknown as WPPost

describe('idadeEmDias', () => {
    it('conta dias e trata data inválida como infinitamente velha', () => {
        expect(idadeEmDias('2026-10-17T12:00:00Z', agora)).toBeCloseTo(1)
        expect(idadeEmDias('lixo', agora)).toBe(Number.POSITIVE_INFINITY)
    })
})

describe('escolherCapa', () => {
    it('mantém a capa fixada enquanto estiver fresca', () => {
        const posts = [post(1, '2026-10-10T00:00:00Z'), post(2, '2026-10-17T00:00:00Z')]
        expect(escolherCapa(posts, 1, agora)?.id).toBe(1)
    })
    it('ignora a fixada velha e usa a mais recente fresca', () => {
        const posts = [post(1, '2026-09-30T00:00:00Z'), post(2, '2026-10-15T00:00:00Z'), post(3, '2026-10-16T00:00:00Z')]
        expect(escolherCapa(posts, 1, agora)?.id).toBe(3)
    })
    it('devolve undefined quando tudo passou do limite (a home usa a produção)', () => {
        const posts = [post(1, '2026-09-30T16:37:00Z'), post(2, '2026-09-26T18:34:00Z')]
        expect(escolherCapa(posts, 1, agora)).toBeUndefined()
    })
    it('o limite é inclusivo', () => {
        const noLimite = new Date(agora.getTime() - DIAS_CAPA_FRESCA * 86_400_000).toISOString()
        expect(escolherCapa([post(1, noLimite)], undefined, agora)?.id).toBe(1)
    })
})
