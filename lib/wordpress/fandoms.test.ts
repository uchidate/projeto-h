import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WordPressIndisponivelError } from './client'
import { getAllFandoms, getFandomBySlug } from './fandoms'
import type { WPGroup } from './types'

const grupos = vi.hoisted(() => vi.fn())
vi.mock('./groups', () => ({ getAllGroups: grupos }))

const grupo = (slug: string, acf: Record<string, unknown>) => ({ slug, acf }) as unknown as WPGroup

describe('fandoms derivados dos grupos', () => {
    beforeEach(() => grupos.mockReset())

    it('junta grafias do mesmo nome e usa a mais frequente', async () => {
        grupos.mockResolvedValue([
            grupo('a', { fandom_name: 'ARMY' }),
            grupo('b', { fandom_name: ' Army ' }),
            grupo('c', { fandom_name: 'ARMY' }),
        ])
        const [fandom, ...resto] = await getAllFandoms()
        expect(resto).toEqual([])
        expect(fandom).toMatchObject({ slug: 'army', name: 'ARMY' })
        expect(fandom.groups.map(g => g.slug)).toEqual(['a', 'b', 'c'])
    })

    it('ignora grupo sem fandom e pega cor e lightstick do primeiro que tiver', async () => {
        grupos.mockResolvedValue([
            grupo('sem', { fandom_name: '  ' }),
            grupo('vazio', {}),
            grupo('a', { fandom_name: 'ONCE' }),
            grupo('b', { fandom_name: 'ONCE', color: '#ff5fa2', lightstick: 'Candy Bong' }),
        ])
        const fandoms = await getAllFandoms()
        expect(fandoms).toHaveLength(1)
        expect(fandoms[0]).toMatchObject({ color: '#ff5fa2', lightstick: 'Candy Bong' })
    })

    it('ordena por nome', async () => {
        grupos.mockResolvedValue(['STAY', 'blink', 'ARMY'].map(n => grupo(n, { fandom_name: n })))
        expect((await getAllFandoms()).map(f => f.name)).toEqual(['ARMY', 'blink', 'STAY'])
    })

    it('acha pelo slug e devolve null para slug que não existe', async () => {
        grupos.mockResolvedValue([grupo('a', { fandom_name: 'ONCE' })])
        expect((await getFandomBySlug('once'))?.name).toBe('ONCE')
        expect(await getFandomBySlug('nao-existe')).toBeNull()
    })

    it('trata lista vazia como WordPress fora do ar, não como 404', async () => {
        grupos.mockResolvedValue([])
        await expect(getFandomBySlug('once')).rejects.toBeInstanceOf(WordPressIndisponivelError)
    })
})
